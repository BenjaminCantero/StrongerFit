
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_events": {
                  Row: {
                    "action": string,"at": string,"id": number,"new_row": Json | null,"old_row": NonNullable<Json>,"row_id": string,"table_name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"at"?: string,"id"?: never,"new_row"?: Json | null,"old_row": NonNullable<Json>,"row_id": string,"table_name": string,"user_id": string
                  }
                  Update: {
                    "action"?: string,"at"?: string,"id"?: never,"new_row"?: Json | null,"old_row"?: NonNullable<Json>,"row_id"?: string,"table_name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"body_measurements": {
                  Row: {
                    "body_fat_pct": number | null,"created_at": string,"hip_cm": number | null,"id": string,"measured_on": string,"updated_at": string,"user_id": string,"waist_cm": number | null,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body_fat_pct"?: number | null,"created_at"?: string,"hip_cm"?: number | null,"id"?: string,"measured_on": string,"updated_at"?: string,"user_id"?: string,"waist_cm"?: number | null,"weight_kg"?: number | null
                  }
                  Update: {
                    "body_fat_pct"?: number | null,"created_at"?: string,"hip_cm"?: number | null,"id"?: string,"measured_on"?: string,"updated_at"?: string,"user_id"?: string,"waist_cm"?: number | null,"weight_kg"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"consents": {
                  Row: {
                    "action": string,"at": string,"id": number,"kind": string,"policy_version": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"at"?: string,"id"?: never,"kind": string,"policy_version": string,"user_id"?: string
                  }
                  Update: {
                    "action"?: string,"at"?: string,"id"?: never,"kind"?: string,"policy_version"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"data_requests": {
                  Row: {
                    "completed_at": string | null,"id": string,"kind": string,"requested_at": string,"status": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"id"?: string,"kind": string,"requested_at"?: string,"status"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "completed_at"?: string | null,"id"?: string,"kind"?: string,"requested_at"?: string,"status"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"food_logs": {
                  Row: {
                    "carbs_g": number,"catalog_version": string,"created_at": string,"entry_id": string,"fat_g": number,"food_id": string,"food_name": string,"grams": number,"id": string,"kcal": number,"license": string,"logged_on": string,"meal": string,"position": number,"protein_g": number,"source": string,"source_version": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "carbs_g": number,"catalog_version": string,"created_at"?: string,"entry_id": string,"fat_g": number,"food_id": string,"food_name": string,"grams": number,"id"?: string,"kcal": number,"license": string,"logged_on": string,"meal": string,"position"?: number,"protein_g": number,"source": string,"source_version": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "carbs_g"?: number,"catalog_version"?: string,"created_at"?: string,"entry_id"?: string,"fat_g"?: number,"food_id"?: string,"food_name"?: string,"grams"?: number,"id"?: string,"kcal"?: number,"license"?: string,"logged_on"?: string,"meal"?: string,"position"?: number,"protein_g"?: number,"source"?: string,"source_version"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"health_screenings": {
                  Row: {
                    "created_at": string,"disclaimer_accepted_at": string,"flags": (string)[],"has_risk": boolean | null,"id": number,"questionnaire_version": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"disclaimer_accepted_at": string,"flags": (string)[],"has_risk"?: never,"id"?: never,"questionnaire_version": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"disclaimer_accepted_at"?: string,"flags"?: (string)[],"has_risk"?: never,"id"?: never,"questionnaire_version"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"load_suggestions": {
                  Row: {
                    "applied_kg": number | null,"created_at": string,"decided_at": string | null,"decision": string,"exercise_id": string,"id": string,"kind": string,"rule_version": string,"session_id": string | null,"suggested_kg": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applied_kg"?: number | null,"created_at"?: string,"decided_at"?: string | null,"decision"?: string,"exercise_id": string,"id"?: string,"kind": string,"rule_version": string,"session_id"?: string | null,"suggested_kg": number,"user_id"?: string
                  }
                  Update: {
                    "applied_kg"?: number | null,"created_at"?: string,"decided_at"?: string | null,"decision"?: string,"exercise_id"?: string,"id"?: string,"kind"?: string,"rule_version"?: string,"session_id"?: string | null,"suggested_kg"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "load_suggestions_session_id_user_id_fkey"
      columns: ["session_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_sessions"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"meal_plans": {
                  Row: {
                    "catalog_version": string,"created_at": string,"id": string,"meals_per_day": number,"nutrition_target_id": string,"params": NonNullable<Json>,"rule_version": string,"status": string,"user_id": string,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_version": string,"created_at"?: string,"id"?: string,"meals_per_day": number,"nutrition_target_id": string,"params"?: NonNullable<Json>,"rule_version": string,"status"?: string,"user_id"?: string,"week_start": string
                  }
                  Update: {
                    "catalog_version"?: string,"created_at"?: string,"id"?: string,"meals_per_day"?: number,"nutrition_target_id"?: string,"params"?: NonNullable<Json>,"rule_version"?: string,"status"?: string,"user_id"?: string,"week_start"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_plans_nutrition_target_id_user_id_fkey"
      columns: ["nutrition_target_id","user_id"]
isOneToOne: false
      referencedRelation: "current_nutrition_targets"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "meal_plans_nutrition_target_id_user_id_fkey"
      columns: ["nutrition_target_id","user_id"]
isOneToOne: false
      referencedRelation: "nutrition_targets"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"nutrition_targets": {
                  Row: {
                    "activity": string,"adjustment": number,"age_years": number,"bmr_kcal": number,"carbs_g": number,"created_at": string,"direction": string,"fat_g": number,"fat_share": number,"formula": string,"height_cm": number,"id": string,"protein_g": number,"protein_per_kg": number,"rest_day_kcal": number | null,"rule_version": string,"sex": string,"target_kcal": number,"tdee_kcal": number,"training_day_kcal": number | null,"user_id": string,"warnings": (string)[],"weight_kg": number
                  }
                  ComputedFields: never
                  Insert: {
                    "activity": string,"adjustment": number,"age_years": number,"bmr_kcal": number,"carbs_g": number,"created_at"?: string,"direction": string,"fat_g": number,"fat_share": number,"formula": string,"height_cm": number,"id"?: string,"protein_g": number,"protein_per_kg": number,"rest_day_kcal"?: number | null,"rule_version": string,"sex": string,"target_kcal": number,"tdee_kcal": number,"training_day_kcal"?: number | null,"user_id"?: string,"warnings"?: (string)[],"weight_kg": number
                  }
                  Update: {
                    "activity"?: string,"adjustment"?: number,"age_years"?: number,"bmr_kcal"?: number,"carbs_g"?: number,"created_at"?: string,"direction"?: string,"fat_g"?: number,"fat_share"?: number,"formula"?: string,"height_cm"?: number,"id"?: string,"protein_g"?: number,"protein_per_kg"?: number,"rest_day_kcal"?: number | null,"rule_version"?: string,"sex"?: string,"target_kcal"?: number,"tdee_kcal"?: number,"training_day_kcal"?: number | null,"user_id"?: string,"warnings"?: (string)[],"weight_kg"?: number
                  }
                  Relationships: [
                    
                  ]
                },"performed_sets": {
                  Row: {
                    "completed": boolean,"duration_seconds": number | null,"estimated": boolean,"exercise_id": string,"exercise_position": number,"id": string,"kind": string,"reps": number | null,"reserve": number | null,"session_id": string,"set_number": number,"updated_at": string,"user_id": string,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "completed"?: boolean,"duration_seconds"?: number | null,"estimated"?: boolean,"exercise_id": string,"exercise_position": number,"id"?: string,"kind"?: string,"reps"?: number | null,"reserve"?: number | null,"session_id": string,"set_number": number,"updated_at"?: string,"user_id"?: string,"weight_kg"?: number | null
                  }
                  Update: {
                    "completed"?: boolean,"duration_seconds"?: number | null,"estimated"?: boolean,"exercise_id"?: string,"exercise_position"?: number,"id"?: string,"kind"?: string,"reps"?: number | null,"reserve"?: number | null,"session_id"?: string,"set_number"?: number,"updated_at"?: string,"user_id"?: string,"weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "performed_sets_session_id_user_id_fkey"
      columns: ["session_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_sessions"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"planned_meals": {
                  Row: {
                    "day": number,"day_type": string | null,"id": string,"items": NonNullable<Json>,"plan_id": string,"slot": string,"target_kcal": number,"target_protein_g": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day": number,"day_type"?: string | null,"id"?: string,"items": NonNullable<Json>,"plan_id": string,"slot": string,"target_kcal": number,"target_protein_g": number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "day"?: number,"day_type"?: string | null,"id"?: string,"items"?: NonNullable<Json>,"plan_id"?: string,"slot"?: string,"target_kcal"?: number,"target_protein_g"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "planned_meals_plan_id_user_id_fkey"
      columns: ["plan_id","user_id"]
isOneToOne: false
      referencedRelation: "meal_plans"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "activity": string,"age_years": number,"created_at": string,"display_name": string,"height_cm": number,"sex": string,"units": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity": string,"age_years": number,"created_at"?: string,"display_name": string,"height_cm": number,"sex": string,"units"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "activity"?: string,"age_years"?: number,"created_at"?: string,"display_name"?: string,"height_cm"?: number,"sex"?: string,"units"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"recommendation_runs": {
                  Row: {
                    "created_at": string,"id": number,"kind": string,"params": NonNullable<Json>,"result_id": string | null,"rule_version": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"kind": string,"params"?: NonNullable<Json>,"result_id"?: string | null,"rule_version": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"kind"?: string,"params"?: NonNullable<Json>,"result_id"?: string | null,"rule_version"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"timer_presets": {
                  Row: {
                    "exercise_id": string,"hold_seconds": number | null,"id": string,"interval_rest_seconds": number | null,"kind": string,"rest_seconds": number,"rounds": number | null,"updated_at": string,"user_id": string,"work_seconds": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "exercise_id": string,"hold_seconds"?: number | null,"id"?: string,"interval_rest_seconds"?: number | null,"kind": string,"rest_seconds": number,"rounds"?: number | null,"updated_at"?: string,"user_id"?: string,"work_seconds"?: number | null
                  }
                  Update: {
                    "exercise_id"?: string,"hold_seconds"?: number | null,"id"?: string,"interval_rest_seconds"?: number | null,"kind"?: string,"rest_seconds"?: number,"rounds"?: number | null,"updated_at"?: string,"user_id"?: string,"work_seconds"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"user_goals": {
                  Row: {
                    "created_at": string,"days_per_week": number,"environment": string,"equipment": (string)[],"goal": string,"id": number,"level": string,"session_minutes": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"days_per_week": number,"environment": string,"equipment": (string)[],"goal": string,"id"?: never,"level": string,"session_minutes": number,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"days_per_week"?: number,"environment"?: string,"equipment"?: (string)[],"goal"?: string,"id"?: never,"level"?: string,"session_minutes"?: number,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"user_injuries": {
                  Row: {
                    "declared_at": string,"id": string,"resolved_at": string | null,"updated_at": string,"user_id": string,"zone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "declared_at"?: string,"id"?: string,"resolved_at"?: string | null,"updated_at"?: string,"user_id"?: string,"zone": string
                  }
                  Update: {
                    "declared_at"?: string,"id"?: string,"resolved_at"?: string | null,"updated_at"?: string,"user_id"?: string,"zone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"user_preferences": {
                  Row: {
                    "created_at": string,"diet_focus": string,"disliked_food_ids": (string)[],"exclusions": (string)[],"meals_per_day": number,"preferred_food_ids": (string)[],"training_day_targets": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"diet_focus"?: string,"disliked_food_ids"?: (string)[],"exclusions"?: (string)[],"meals_per_day"?: number,"preferred_food_ids"?: (string)[],"training_day_targets"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"diet_focus"?: string,"disliked_food_ids"?: (string)[],"exclusions"?: (string)[],"meals_per_day"?: number,"preferred_food_ids"?: (string)[],"training_day_targets"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"weight_goals": {
                  Row: {
                    "created_at": string,"end_date": string,"id": string,"pace_confirmed": boolean,"start_date": string,"start_kg": number,"status": string,"target_kg": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_date": string,"id"?: string,"pace_confirmed"?: boolean,"start_date": string,"start_kg": number,"status"?: string,"target_kg": number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"end_date"?: string,"id"?: string,"pace_confirmed"?: boolean,"start_date"?: string,"start_kg"?: number,"status"?: string,"target_kg"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"workout_days": {
                  Row: {
                    "id": string,"name": string,"plan_id": string,"position": number,"user_id": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"plan_id": string,"position": number,"user_id"?: string,"weekday": number
                  }
                  Update: {
                    "id"?: string,"name"?: string,"plan_id"?: string,"position"?: number,"user_id"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_days_plan_id_user_id_fkey"
      columns: ["plan_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_plans"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"workout_exercises": {
                  Row: {
                    "day_id": string,"exercise_id": string,"id": string,"note": string | null,"position": number,"reps_max": number,"reps_min": number,"rest_seconds": number,"sets": number,"tempo": (number)[] | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day_id": string,"exercise_id": string,"id"?: string,"note"?: string | null,"position": number,"reps_max": number,"reps_min": number,"rest_seconds": number,"sets": number,"tempo"?: (number)[] | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "day_id"?: string,"exercise_id"?: string,"id"?: string,"note"?: string | null,"position"?: number,"reps_max"?: number,"reps_min"?: number,"rest_seconds"?: number,"sets"?: number,"tempo"?: (number)[] | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_exercises_day_id_user_id_fkey"
      columns: ["day_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_days"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"workout_plans": {
                  Row: {
                    "catalog_version": string,"changes": NonNullable<Json>,"created_at": string,"days_per_week": number,"environment": string,"equipment": (string)[],"id": string,"level": string,"rule_version": string,"session_minutes": number,"status": string,"template_id": string,"template_version": string,"user_id": string,"warnings": (string)[],"zones": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_version": string,"changes"?: NonNullable<Json>,"created_at"?: string,"days_per_week": number,"environment": string,"equipment": (string)[],"id"?: string,"level": string,"rule_version": string,"session_minutes": number,"status"?: string,"template_id": string,"template_version": string,"user_id"?: string,"warnings"?: (string)[],"zones"?: (string)[]
                  }
                  Update: {
                    "catalog_version"?: string,"changes"?: NonNullable<Json>,"created_at"?: string,"days_per_week"?: number,"environment"?: string,"equipment"?: (string)[],"id"?: string,"level"?: string,"rule_version"?: string,"session_minutes"?: number,"status"?: string,"template_id"?: string,"template_version"?: string,"user_id"?: string,"warnings"?: (string)[],"zones"?: (string)[]
                  }
                  Relationships: [
                    
                  ]
                },"workout_sessions": {
                  Row: {
                    "client_id": string,"created_at": string,"day_id": string | null,"finished_at": string,"id": string,"plan_id": string | null,"started_at": string,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"day_id"?: string | null,"finished_at": string,"id"?: string,"plan_id"?: string | null,"started_at": string,"title": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"day_id"?: string | null,"finished_at"?: string,"id"?: string,"plan_id"?: string | null,"started_at"?: string,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sessions_day_id_user_id_fkey"
      columns: ["day_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_days"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "workout_sessions_plan_id_user_id_fkey"
      columns: ["plan_id","user_id"]
isOneToOne: false
      referencedRelation: "workout_plans"
      referencedColumns: ["id","user_id"]
    }
                  ]
                }
          }
          Views: {
            "current_consents": {
                  Row: {
                    "action": string,"at": string,"id": number,"kind": string,"policy_version": string,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"current_health_screening": {
                  Row: {
                    "created_at": string,"disclaimer_accepted_at": string,"flags": (string)[],"has_risk": boolean | null,"id": number,"questionnaire_version": string,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"current_nutrition_targets": {
                  Row: {
                    "activity": string,"adjustment": number,"age_years": number,"bmr_kcal": number,"carbs_g": number,"created_at": string,"direction": string,"fat_g": number,"fat_share": number,"formula": string,"height_cm": number,"id": string,"protein_g": number,"protein_per_kg": number,"rest_day_kcal": number | null,"rule_version": string,"sex": string,"target_kcal": number,"tdee_kcal": number,"training_day_kcal": number | null,"user_id": string,"warnings": (string)[],"weight_kg": number
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"current_user_goals": {
                  Row: {
                    "created_at": string,"days_per_week": number,"environment": string,"equipment": (string)[],"goal": string,"id": number,"level": string,"session_minutes": number,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "complete_onboarding":
{ Args: { "payload": Json }; Returns: boolean
                           },
"has_health_consent":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"has_health_risk":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"save_meal_plan":
{ Args: { "payload": Json }; Returns: string
                           },
"save_workout_plan":
{ Args: { "payload": Json }; Returns: string
                           },
"submit_session":
{ Args: { "payload": Json }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
