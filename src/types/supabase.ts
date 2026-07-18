// Hand-authored to match the shape produced by `supabase gen types
// typescript`. Normally this file is machine-generated; it's written by
// hand here because `supabase gen types --db-url` shells out to a
// postgres-meta container (via Docker/Podman) and neither is available in
// this environment. Every table/column/enum below mirrors
// supabase/migrations/*.sql exactly, and was cross-checked by applying
// those migrations to a real local Postgres instance (see the Phase 3
// verification run) before being transcribed.
//
// Once a real Supabase project exists (Phase 3 follow-up / Phase 4), refresh
// this file for real via:
//   pnpm dlx supabase gen types typescript --project-id <ref> > src/types/supabase.ts

export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: Database['public']['Enums']['app_role'];
          xp: number;
          level: number;
          coins: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          last_active_at: string | null;
          daily_goal_minutes: number;
          learning_goal: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: Database['public']['Enums']['app_role'];
          xp?: number;
          level?: number;
          coins?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          last_active_at?: string | null;
          daily_goal_minutes?: number;
          learning_goal?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };

      settings: {
        Row: {
          user_id: string;
          theme: Database['public']['Enums']['theme_preference'];
          sound_enabled: boolean;
          reduced_motion: boolean;
          email_reminders: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: Database['public']['Enums']['theme_preference'];
          sound_enabled?: boolean;
          reduced_motion?: boolean;
          email_reminders?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
        Relationships: [];
      };

      roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database['public']['Enums']['app_role'];
          granted_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['roles']['Insert']>;
        Relationships: [];
      };

      subjects: {
        Row: {
          id: string;
          slug: Database['public']['Enums']['subject_slug'];
          name: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: Database['public']['Enums']['subject_slug'];
          name: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
        Relationships: [];
      };

      topics: {
        Row: {
          id: string;
          subject_id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['topics']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'topics_subject_id_fkey';
            columns: ['subject_id'];
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };

      lessons: {
        Row: {
          id: string;
          topic_id: string;
          slug: string;
          title: string;
          description: string | null;
          difficulty: Database['public']['Enums']['difficulty_level'];
          xp_reward: number;
          estimated_minutes: number;
          sort_order: number;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          slug: string;
          title: string;
          description?: string | null;
          difficulty?: Database['public']['Enums']['difficulty_level'];
          xp_reward?: number;
          estimated_minutes?: number;
          sort_order?: number;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'lessons_topic_id_fkey';
            columns: ['topic_id'];
            referencedRelation: 'topics';
            referencedColumns: ['id'];
          },
        ];
      };

      lesson_prerequisites: {
        Row: {
          lesson_id: string;
          prerequisite_lesson_id: string;
        };
        Insert: {
          lesson_id: string;
          prerequisite_lesson_id: string;
        };
        Update: Partial<Database['public']['Tables']['lesson_prerequisites']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'lesson_prerequisites_lesson_id_fkey';
            columns: ['lesson_id'];
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lesson_prerequisites_prerequisite_lesson_id_fkey';
            columns: ['prerequisite_lesson_id'];
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };

      quizzes: {
        Row: {
          id: string;
          topic_id: string;
          lesson_id: string | null;
          title: string;
          description: string | null;
          difficulty: Database['public']['Enums']['difficulty_level'];
          is_timed: boolean;
          time_limit_seconds: number | null;
          is_adaptive: boolean;
          xp_reward: number;
          is_challenge: boolean;
          challenge_period: string | null;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          lesson_id?: string | null;
          title: string;
          description?: string | null;
          difficulty?: Database['public']['Enums']['difficulty_level'];
          is_timed?: boolean;
          time_limit_seconds?: number | null;
          is_adaptive?: boolean;
          xp_reward?: number;
          is_challenge?: boolean;
          challenge_period?: string | null;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quizzes']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'quizzes_topic_id_fkey';
            columns: ['topic_id'];
            referencedRelation: 'topics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quizzes_lesson_id_fkey';
            columns: ['lesson_id'];
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };

      questions: {
        Row: {
          id: string;
          quiz_id: string | null;
          type: Database['public']['Enums']['question_type'];
          prompt: string;
          prompt_media_url: string | null;
          explanation: string | null;
          difficulty: Database['public']['Enums']['difficulty_level'];
          sort_order: number;
          points: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id?: string | null;
          type: Database['public']['Enums']['question_type'];
          prompt: string;
          prompt_media_url?: string | null;
          explanation?: string | null;
          difficulty?: Database['public']['Enums']['difficulty_level'];
          sort_order?: number;
          points?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['questions']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'questions_quiz_id_fkey';
            columns: ['quiz_id'];
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
        ];
      };

      answers: {
        Row: {
          id: string;
          question_id: string;
          content: string;
          is_correct: boolean;
          match_pattern: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          content: string;
          is_correct?: boolean;
          match_pattern?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['answers']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'answers_question_id_fkey';
            columns: ['question_id'];
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
        ];
      };

      lesson_sections: {
        Row: {
          id: string;
          lesson_id: string;
          section_type: Database['public']['Enums']['lesson_section_type'];
          sort_order: number;
          content: Json;
          question_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          section_type: Database['public']['Enums']['lesson_section_type'];
          sort_order?: number;
          content?: Json;
          question_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lesson_sections']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'lesson_sections_lesson_id_fkey';
            columns: ['lesson_id'];
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lesson_sections_question_id_fkey';
            columns: ['question_id'];
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
        ];
      };

      user_progress: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          status: Database['public']['Enums']['progress_status'];
          mastery_percent: number;
          lessons_completed: number;
          lessons_total: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          status?: Database['public']['Enums']['progress_status'];
          mastery_percent?: number;
          lessons_completed?: number;
          lessons_total?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_progress']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'user_progress_topic_id_fkey';
            columns: ['topic_id'];
            referencedRelation: 'topics';
            referencedColumns: ['id'];
          },
        ];
      };

      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          mode: Database['public']['Enums']['lesson_mode'];
          status: Database['public']['Enums']['progress_status'];
          completion_percent: number;
          correct_count: number;
          incorrect_count: number;
          time_spent_seconds: number;
          last_section_id: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          mode?: Database['public']['Enums']['lesson_mode'];
          status?: Database['public']['Enums']['progress_status'];
          completion_percent?: number;
          correct_count?: number;
          incorrect_count?: number;
          time_spent_seconds?: number;
          last_section_id?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['lesson_progress']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'lesson_progress_lesson_id_fkey';
            columns: ['lesson_id'];
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lesson_progress_last_section_id_fkey';
            columns: ['last_section_id'];
            referencedRelation: 'lesson_sections';
            referencedColumns: ['id'];
          },
        ];
      };

      quiz_progress: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          status: Database['public']['Enums']['progress_status'];
          score: number | null;
          correct_count: number;
          incorrect_count: number;
          time_spent_seconds: number;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          status?: Database['public']['Enums']['progress_status'];
          score?: number | null;
          correct_count?: number;
          incorrect_count?: number;
          time_spent_seconds?: number;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['quiz_progress']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'quiz_progress_quiz_id_fkey';
            columns: ['quiz_id'];
            referencedRelation: 'quizzes';
            referencedColumns: ['id'];
          },
        ];
      };

      question_attempts: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          quiz_progress_id: string | null;
          lesson_progress_id: string | null;
          is_correct: boolean;
          response: Json;
          time_spent_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          quiz_progress_id?: string | null;
          lesson_progress_id?: string | null;
          is_correct: boolean;
          response: Json;
          time_spent_seconds?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['question_attempts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'question_attempts_question_id_fkey';
            columns: ['question_id'];
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'question_attempts_quiz_progress_id_fkey';
            columns: ['quiz_progress_id'];
            referencedRelation: 'quiz_progress';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'question_attempts_lesson_progress_id_fkey';
            columns: ['lesson_progress_id'];
            referencedRelation: 'lesson_progress';
            referencedColumns: ['id'];
          },
        ];
      };

      xp_history: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: Database['public']['Enums']['xp_reason'];
          source_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason: Database['public']['Enums']['xp_reason'];
          source_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['xp_history']['Insert']>;
        Relationships: [];
      };

      streaks: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          streak_count_at_date: number;
          freeze_used: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date: string;
          streak_count_at_date: number;
          freeze_used?: boolean;
        };
        Update: Partial<Database['public']['Tables']['streaks']['Insert']>;
        Relationships: [];
      };

      achievements: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon: string | null;
          criteria: Json;
          xp_bonus: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          icon?: string | null;
          criteria: Json;
          xp_bonus?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
        Relationships: [];
      };

      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            referencedRelation: 'achievements';
            referencedColumns: ['id'];
          },
        ];
      };

      avatars: {
        Row: {
          id: string;
          name: string;
          image_url: string;
          is_premium: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          image_url: string;
          is_premium?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['avatars']['Insert']>;
        Relationships: [];
      };

      review_schedule: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          ease_factor: number;
          interval_days: number;
          repetitions: number;
          memory_strength: number;
          due_at: string;
          last_reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          ease_factor?: number;
          interval_days?: number;
          repetitions?: number;
          memory_strength?: number;
          due_at?: string;
          last_reviewed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['review_schedule']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'review_schedule_question_id_fkey';
            columns: ['question_id'];
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
        ];
      };

      daily_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          minutes_spent: number;
          lessons_completed: number;
          quizzes_completed: number;
          xp_earned: number;
          correct_answers: number;
          incorrect_answers: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date: string;
          minutes_spent?: number;
          lessons_completed?: number;
          quizzes_completed?: number;
          xp_earned?: number;
          correct_answers?: number;
          incorrect_answers?: number;
        };
        Update: Partial<Database['public']['Tables']['daily_activity']['Insert']>;
        Relationships: [];
      };

      statistics: {
        Row: {
          id: string;
          user_id: string;
          period_type: Database['public']['Enums']['stats_period'];
          period_start: string;
          total_minutes: number;
          total_xp: number;
          lessons_completed: number;
          quizzes_completed: number;
          accuracy_percent: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_type: Database['public']['Enums']['stats_period'];
          period_start: string;
          total_minutes?: number;
          total_xp?: number;
          lessons_completed?: number;
          quizzes_completed?: number;
          accuracy_percent?: number | null;
        };
        Update: Partial<Database['public']['Tables']['statistics']['Insert']>;
        Relationships: [];
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: Database['public']['Enums']['notification_type'];
          title: string;
          body: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database['public']['Enums']['notification_type'];
          title: string;
          body?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };

      admin_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_table: string;
          target_id: string | null;
          diff: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_table: string;
          target_id?: string | null;
          diff?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_logs']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'user' | 'admin';
      subject_slug: 'english' | 'mathematics';
      difficulty_level:
        'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';
      question_type:
        | 'multiple_choice'
        | 'fill_blank'
        | 'drag_drop'
        | 'matching'
        | 'ordering'
        | 'typing'
        | 'image_choice';
      lesson_mode: 'practice' | 'challenge' | 'review';
      progress_status: 'not_started' | 'in_progress' | 'completed';
      lesson_section_type:
        'explanation' | 'example' | 'interactive_exercise' | 'hint' | 'summary';
      xp_reason:
        | 'lesson_complete'
        | 'quiz_complete'
        | 'streak_bonus'
        | 'achievement'
        | 'daily_challenge';
      stats_period: 'weekly' | 'monthly';
      theme_preference: 'dark' | 'light' | 'system';
      notification_type:
        | 'streak_reminder'
        | 'achievement_unlocked'
        | 'admin_announcement'
        | 'lesson_recommendation'
        | 'review_due';
    };
    CompositeTypes: Record<string, never>;
  };
}

// ---- convenience helpers (mirrors the pattern in the Supabase docs) ----

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];

export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
