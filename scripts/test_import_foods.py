"""Synthetic CSV fixtures exercise import failure modes; never feed the catalog."""
import copy
import csv
import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('import_foods', Path(__file__).with_name('import-foods.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.mapping = [{'id': 'fixture', 'fdcId': 1, 'dataset': 'SR Legacy', 'usdaDescription': 'Fixture',
                         'name': 'Prueba', 'role': 'protein', 'meals': ['lunch'], 'tags': [],
                         'servingGrams': 100, 'defaultGrams': 100, 'pairingIds': []}]
        self.manifest = {'release': 'test', 'importedAt': '2026-11-09', 'originalIds': [], 'sha256': {},
                         'nutrients': {'kcal': {'id': '1008', 'name': 'Energy', 'unit': 'KCAL'},
                                       'protein': {'id': '1003', 'name': 'Protein', 'unit': 'G'},
                                       'carbs': {'id': '1005', 'name': 'Carbohydrate, by difference', 'unit': 'G'},
                                       'fat': {'id': '1004', 'name': 'Total lipid (fat)', 'unit': 'G'}}}
        self.write('food.csv', ['fdc_id', 'description', 'data_type'], [[1, 'Fixture', 'sr_legacy_food']])
        self.definitions = [[v['id'], v['name'], v['unit']] for v in self.manifest['nutrients'].values()]
        self.write('nutrient.csv', ['id', 'name', 'unit_name'], self.definitions)
        self.values = [[1, '1008', 80], [1, '1003', 20], [1, '1005', 0], [1, '1004', 0], [1, '1062', 335]]
        self.write_values()

    def write(self, name, headers, rows):
        path = self.directory / name
        with path.open('w', newline='') as stream:
            writer = csv.writer(stream)
            writer.writerow(headers)
            writer.writerows(rows)
        self.manifest['sha256'][name] = hashlib.sha256(path.read_bytes()).hexdigest()

    def write_values(self):
        self.write('food_nutrient.csv', ['fdc_id', 'nutrient_id', 'amount'], self.values)

    def run_import(self):
        return module.import_catalog(self.directory, self.mapping, [], self.manifest)

    def test_kcal_not_kj_and_zero_is_valid(self):
        foods, excluded = self.run_import()
        self.assertEqual(excluded, [])
        self.assertEqual(foods[0]['per100g'], {'kcal': 80, 'protein': 20, 'carbs': 0, 'fat': 0})
        self.assertEqual(foods[0]['provenance']['fdcId'], 1)

    def test_each_missing_or_invalid_macro_excludes_food(self):
        initial = copy.deepcopy(self.values)
        for index in range(4):
            for value in ['', 'nan', '-1']:
                self.values = copy.deepcopy(initial)
                self.values[index][2] = value
                self.write_values()
                foods, excluded = self.run_import()
                self.assertEqual(foods, [])
                self.assertEqual(len(excluded), 1)
            self.values = [row for i, row in enumerate(initial) if i != index]
            self.write_values()
            self.assertEqual(self.run_import()[0], [])

    def test_rejects_kj_definition_in_kcal_field(self):
        self.definitions[0][2] = 'kJ'
        self.write('nutrient.csv', ['id', 'name', 'unit_name'], self.definitions)
        with self.assertRaisesRegex(ValueError, 'definition/unit'):
            self.run_import()

    def test_byte_determinism_independent_of_csv_order(self):
        first = module.render(self.run_import()[0]).encode()
        self.values.reverse()
        self.write_values()
        self.assertEqual(first, module.render(self.run_import()[0]).encode())

    def test_rejects_unreviewed_source_change(self):
        with (self.directory / 'food.csv').open('a') as stream:
            stream.write('\n')
        with self.assertRaisesRegex(ValueError, 'SHA-256'):
            self.run_import()

    def test_rejects_duplicate_ids_and_changed_food_identity(self):
        self.mapping.append(copy.deepcopy(self.mapping[0]))
        with self.assertRaisesRegex(ValueError, 'Duplicate internal'):
            self.run_import()
        self.mapping.pop()
        self.mapping[0]['usdaDescription'] = 'Another food'
        with self.assertRaisesRegex(ValueError, 'changed description'):
            self.run_import()

    def test_per_item_imported_at(self):
        self.assertEqual(self.run_import()[0][0]['provenance']['importedAt'], '2026-11-09')
        self.mapping[0]['importedAt'] = '2026-11-26'
        food = self.run_import()[0][0]
        self.assertEqual(food['provenance']['importedAt'], '2026-11-26')
        self.assertNotIn('importedAt', food)

    def test_rejects_invalid_imported_at(self):
        for bad in ['26-11-2026', '2026-11-26T00:00', '', None, 20261126]:
            self.mapping[0]['importedAt'] = bad
            with self.assertRaisesRegex(ValueError, 'importedAt'):
                self.run_import()


if __name__ == '__main__':
    unittest.main()
