#!/usr/bin/env python3
"""Offline, deterministic USDA SR Legacy CSV import. Python 3 standard library only."""
import argparse
import csv
import hashlib
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'packages/nutrition-engine/data'
OUTPUT = ROOT / 'packages/nutrition-engine/src/foods.generated.ts'
ROLES = {'protein', 'dairy', 'carb', 'veg', 'fruit', 'fat'}
MEALS = {'breakfast', 'lunch', 'snack', 'dinner'}
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
TAGS = {'gluten', 'lactosa', 'lacteo', 'frutos-secos', 'mani', 'huevo', 'pescado', 'mariscos', 'soya', 'carne', 'animal'}


def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as stream:
        return list(csv.DictReader(stream))


def import_catalog(directory, mapping, own, manifest):
    # Pin bytes as well as release name: USDA sometimes corrects historical archives.
    for filename, expected in manifest['sha256'].items():
        actual = hashlib.sha256((directory / filename).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'{filename}: SHA-256 mismatch; review source before updating manifest')
    definitions = {row['id']: row for row in read_csv(directory / 'nutrient.csv')}
    for field, spec in manifest['nutrients'].items():
        row = definitions.get(spec['id'], {})
        if (row.get('name'), row.get('unit_name')) != (spec['name'], spec['unit']):
            raise ValueError(f'{field}: unexpected USDA nutrient definition/unit')
    source = {int(row['fdc_id']): row for row in read_csv(directory / 'food.csv')}
    ids = [row['id'] for row in mapping + own]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate internal IDs')
    fdc_ids = [row['fdcId'] for row in mapping]
    if len(fdc_ids) != len(set(fdc_ids)):
        raise ValueError('Duplicate FDC IDs')
    for row in mapping + own:
        if row['role'] not in ROLES or not row['meals'] or not set(row['meals']) <= MEALS or not set(row['tags']) <= TAGS:
            raise ValueError(f"{row['id']}: invalid curation")
        if not set(row['pairingIds']) <= set(ids):
            raise ValueError(f"{row['id']}: unknown pairing")
        if any(not isinstance(row[k], (int, float)) or not math.isfinite(row[k]) or row[k] <= 0 for k in ['servingGrams', 'defaultGrams']):
            raise ValueError(f"{row['id']}: invalid portion")
        tags = set(row['tags'])
        if ('lactosa' in tags and 'lacteo' not in tags) or (tags & {'lacteo', 'huevo', 'carne', 'pescado', 'mariscos'} and 'animal' not in tags):
            raise ValueError(f"{row['id']}: inconsistent restriction tags")
    wanted = set(fdc_ids)
    nutrient_fields = {spec['id']: field for field, spec in manifest['nutrients'].items()}
    values = {fid: {} for fid in wanted}
    for row in read_csv(directory / 'food_nutrient.csv'):
        fid = int(row['fdc_id'])
        field = nutrient_fields.get(row['nutrient_id'])
        if fid not in wanted or field is None:
            continue
        if field in values[fid]:
            raise ValueError(f'{fid}: duplicate nutrient {field}')
        # Empty is missing, never zero. Zero itself is a valid measured value.
        amount = row['amount'].strip()
        values[fid][field] = float(amount) if amount else None
    catalog, excluded = [], []
    for row in mapping:
        fid = row['fdcId']
        original = source.get(fid)
        if not original or original['data_type'] != 'sr_legacy_food' or row['dataset'] != 'SR Legacy' or original['description'] != row['usdaDescription']:
            raise ValueError(f'{fid}: missing food, wrong dataset or changed description')
        nutrients = values[fid]
        missing = [field for field in nutrient_fields.values() if nutrients.get(field) is None or not math.isfinite(nutrients[field]) or nutrients[field] < 0]
        if missing:
            excluded.append({'id': row['id'], 'fdcId': fid, 'missing': missing})
            continue
        # Fecha de importación por ítem: opcional, cae al manifiesto si falta.
        imported_at = row.get('importedAt', manifest['importedAt'])
        if not isinstance(imported_at, str) or not DATE.match(imported_at):
            raise ValueError(f"{row['id']}: importedAt must be YYYY-MM-DD")
        food = {key: value for key, value in row.items() if key not in {'fdcId', 'dataset', 'usdaDescription', 'importedAt'}}
        food.update(per100g={key: nutrients[key] for key in manifest['nutrients']}, verified=True, provenance={
            'source': 'USDA FoodData Central', 'fdcId': fid, 'dataset': 'SR Legacy',
            'version': manifest['release'], 'license': 'CC0-1.0', 'importedAt': imported_at,
        })
        catalog.append(food)
    for row in own:
        if row.get('verified') is not False or row.get('provenance', {}).get('source') != 'StrongerFit' or not row['provenance'].get('reason'):
            raise ValueError('Local food must explicitly remain unverified')
    catalog.extend(own)
    # Preserve original order (and initial selection) while remaining independent of CSV order.
    order = {fid: index for index, fid in enumerate(manifest['originalIds'])}
    catalog.sort(key=lambda food: (order.get(food['id'], len(order)), food['id']))
    # Pairings to excluded foods must not leak dangling references into the UI.
    available = {food['id'] for food in catalog}
    for food in catalog:
        food['pairingIds'] = [fid for fid in food['pairingIds'] if fid in available]
    return catalog, excluded


def render(catalog):
    return ('// Generated by scripts/import-foods.py. Do not edit.\n'
            "import type { CatalogFood } from './foods';\n\n"
            'export const foodCatalog: CatalogFood[] = ' + json.dumps(catalog, ensure_ascii=False, indent=2, allow_nan=False) + ';\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path, help='Unzipped official SR Legacy CSV directory')
    parser.add_argument('--check', action='store_true', help='Compare bytes without modifying files')
    args = parser.parse_args()
    mapping, own, manifest = [json.loads((DATA / name).read_text()) for name in ['food-mapping.json', 'unverified-foods.json', 'usda-release.json']]
    catalog, excluded = import_catalog(args.directory, mapping, own, manifest)
    outputs = {OUTPUT: render(catalog), DATA / 'import-report.json': json.dumps({'excluded': excluded}, ensure_ascii=False, indent=2) + '\n'}
    for path, value in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes() != value.encode('utf-8'):
                raise ValueError(f'{path}: regeneration differs')
        else:
            path.write_bytes(value.encode('utf-8'))
    print(f'{len(catalog)} foods; {len(excluded)} excluded for incomplete nutrients')
    for row in excluded:
        print(json.dumps(row))


if __name__ == '__main__':
    main()
