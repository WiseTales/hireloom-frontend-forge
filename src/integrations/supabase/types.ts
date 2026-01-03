export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applicants: {
        Row: {
          created_at: string | null
          created_by: string
          email: string
          id: string
          job_id: string | null
          name: string
          notes: string | null
          phone: string | null
          referred_by: string | null
          resume_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          email: string
          id?: string
          job_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          referred_by?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          email?: string
          id?: string
          job_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          referred_by?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicants_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      article_comments: {
        Row: {
          article_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          content: string
          cover_image_url: string | null
          created_at: string | null
          id: string
          published: boolean | null
          subtitle: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          published?: boolean | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          published?: boolean | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string
          issuing_organization: string
          name: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date: string
          issuing_organization: string
          name: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          issuing_organization?: string
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_size: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          name: string
          website: string | null
        }
        Insert: {
          company_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          website?: string | null
        }
        Update: {
          company_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      company_followers: {
        Row: {
          company_id: string
          followed_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          followed_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          followed_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_followers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          role: Database["public"]["Enums"]["company_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          role: Database["public"]["Enums"]["company_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["company_role"]
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["company_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string | null
          id: string
          recipient_id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipient_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          created_at: string
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          profile_id: string
          school: string
          start_date: string
        }
        Insert: {
          created_at?: string
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          profile_id: string
          school: string
          start_date: string
        }
        Update: {
          created_at?: string
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          profile_id?: string
          school?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          event_id: string
          id: string
          rsvp_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          rsvp_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          rsvp_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string
          end_time: string
          event_type: string
          event_url: string | null
          id: string
          image_url: string | null
          location: string | null
          max_attendees: number | null
          organizer_id: string
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          end_time: string
          event_type: string
          event_url?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          organizer_id: string
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          end_time?: string
          event_type?: string
          event_url?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          member_count: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      hashtag_followers: {
        Row: {
          followed_at: string | null
          hashtag_id: string
          id: string
          user_id: string
        }
        Insert: {
          followed_at?: string | null
          hashtag_id: string
          id?: string
          user_id: string
        }
        Update: {
          followed_at?: string | null
          hashtag_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_followers_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          use_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          use_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          use_count?: number | null
        }
        Relationships: []
      }
      interview_feedback: {
        Row: {
          communication_rating: number | null
          culture_fit_rating: number | null
          id: string
          interview_id: string
          interviewer_id: string
          notes: string | null
          overall_rating: number | null
          recommendation: string | null
          strengths: string | null
          submitted_at: string | null
          technical_rating: number | null
          weaknesses: string | null
        }
        Insert: {
          communication_rating?: number | null
          culture_fit_rating?: number | null
          id?: string
          interview_id: string
          interviewer_id: string
          notes?: string | null
          overall_rating?: number | null
          recommendation?: string | null
          strengths?: string | null
          submitted_at?: string | null
          technical_rating?: number | null
          weaknesses?: string | null
        }
        Update: {
          communication_rating?: number | null
          culture_fit_rating?: number | null
          id?: string
          interview_id?: string
          interviewer_id?: string
          notes?: string | null
          overall_rating?: number | null
          recommendation?: string | null
          strengths?: string | null
          submitted_at?: string | null
          technical_rating?: number | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          applicant_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          interview_type: string | null
          interviewer_id: string
          job_id: string
          location: string | null
          meeting_link: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          interview_type?: string | null
          interviewer_id: string
          job_id: string
          location?: string | null
          meeting_link?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          interview_type?: string | null
          interviewer_id?: string
          job_id?: string
          location?: string | null
          meeting_link?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_alerts: {
        Row: {
          created_at: string | null
          experience_level: string | null
          id: string
          is_remote: boolean | null
          job_type: string | null
          keywords: string[] | null
          location: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_level?: string | null
          id?: string
          is_remote?: boolean | null
          job_type?: string | null
          keywords?: string[] | null
          location?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          experience_level?: string | null
          id?: string
          is_remote?: boolean | null
          job_type?: string | null
          keywords?: string[] | null
          location?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applied_at: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"] | null
          user_id: string
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applied_at?: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"] | null
          user_id: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applied_at?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          category: string
          company: string
          company_id: string | null
          created_at: string
          department: string | null
          description: string
          employee_range: string | null
          experience_level: string | null
          id: string
          is_published: boolean | null
          is_remote: boolean | null
          location: string
          location_type: Database["public"]["Enums"]["location_type"] | null
          posted_by: string
          salary: string | null
          skills_required: string[] | null
          team: string | null
          title: string
          type: string
          updated_at: string
          visibility: Database["public"]["Enums"]["job_visibility"] | null
          work_type: Database["public"]["Enums"]["work_type"] | null
        }
        Insert: {
          category: string
          company: string
          company_id?: string | null
          created_at?: string
          department?: string | null
          description: string
          employee_range?: string | null
          experience_level?: string | null
          id?: string
          is_published?: boolean | null
          is_remote?: boolean | null
          location: string
          location_type?: Database["public"]["Enums"]["location_type"] | null
          posted_by: string
          salary?: string | null
          skills_required?: string[] | null
          team?: string | null
          title: string
          type: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["job_visibility"] | null
          work_type?: Database["public"]["Enums"]["work_type"] | null
        }
        Update: {
          category?: string
          company?: string
          company_id?: string | null
          created_at?: string
          department?: string | null
          description?: string
          employee_range?: string | null
          experience_level?: string | null
          id?: string
          is_published?: boolean | null
          is_remote?: boolean | null
          location?: string
          location_type?: Database["public"]["Enums"]["location_type"] | null
          posted_by?: string
          salary?: string | null
          skills_required?: string[] | null
          team?: string | null
          title?: string
          type?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["job_visibility"] | null
          work_type?: Database["public"]["Enums"]["work_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          article_updates: boolean | null
          comments: boolean | null
          connection_requests: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          event_reminders: boolean | null
          id: string
          job_alerts: boolean | null
          messages: boolean | null
          post_reactions: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          article_updates?: boolean | null
          comments?: boolean | null
          connection_requests?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          event_reminders?: boolean | null
          id?: string
          job_alerts?: boolean | null
          messages?: boolean | null
          post_reactions?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          article_updates?: boolean | null
          comments?: boolean | null
          connection_requests?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          event_reminders?: boolean | null
          id?: string
          job_alerts?: boolean | null
          messages?: boolean | null
          post_reactions?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          id: string
          option_index: number
          poll_id: string
          user_id: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          option_index: number
          poll_id: string
          user_id: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          options: Json
          post_id: string
          question: string
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          options: Json
          post_id: string
          question: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          options?: Json
          post_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string | null
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          document_url: string | null
          id: string
          image_url: string | null
          shared_post_id: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          shared_post_id?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          shared_post_id?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_shared_post_id_fkey"
            columns: ["shared_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_analytics: {
        Row: {
          date: string
          id: string
          new_connections: number | null
          post_engagements: number | null
          post_impressions: number | null
          profile_id: string
          profile_views: number | null
        }
        Insert: {
          date: string
          id?: string
          new_connections?: number | null
          post_engagements?: number | null
          post_impressions?: number | null
          profile_id: string
          profile_views?: number | null
        }
        Update: {
          date?: string
          id?: string
          new_connections?: number | null
          post_engagements?: number | null
          post_impressions?: number | null
          profile_id?: string
          profile_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_analytics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          skill_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          skill_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          cover_photo_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          headline: string | null
          id: string
          profile_completion: number | null
          resume_url: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          headline?: string | null
          id: string
          profile_completion?: number | null
          resume_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          profile_completion?: number | null
          resume_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string
          end_date: string | null
          id: string
          image_url: string | null
          profile_id: string
          start_date: string
          technologies: string[] | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          profile_id: string
          start_date: string
          technologies?: string[] | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          profile_id?: string
          start_date?: string
          technologies?: string[] | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_applications: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          job_id: string
          resume_url: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          job_id: string
          resume_url: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          job_id?: string
          resume_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          recipient_id: string
          recommender_id: string
          relationship: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          recipient_id: string
          recommender_id: string
          relationship: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          recipient_id?: string
          recommender_id?: string
          relationship?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_recommender_id_fkey"
            columns: ["recommender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          candidate_email: string
          candidate_name: string
          candidate_phone: string | null
          created_at: string | null
          id: string
          job_id: string
          notes: string | null
          referrer_id: string
          relationship: string | null
          status: string | null
        }
        Insert: {
          candidate_email: string
          candidate_name: string
          candidate_phone?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          notes?: string | null
          referrer_id: string
          relationship?: string | null
          status?: string | null
        }
        Update: {
          candidate_email?: string
          candidate_name?: string
          candidate_phone?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          referrer_id?: string
          relationship?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_content_id: string
          reported_content_type: string
          reporter_id: string
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_content_id: string
          reported_content_type: string
          reporter_id: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_content_id?: string
          reported_content_type?: string
          reporter_id?: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      saved_articles: {
        Row: {
          article_id: string
          id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          article_id: string
          id?: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          article_id?: string
          id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          id: string
          job_id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          job_id: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          job_id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_endorsements: {
        Row: {
          endorsed_at: string | null
          endorser_id: string
          id: string
          skill_id: string
        }
        Insert: {
          endorsed_at?: string | null
          endorser_id: string
          id?: string
          skill_id: string
        }
        Update: {
          endorsed_at?: string | null
          endorser_id?: string
          id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_endorsements_endorser_id_fkey"
            columns: ["endorser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_endorsements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "profile_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_experience: {
        Row: {
          company: string
          created_at: string
          currently_working: boolean
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          profile_id: string
          start_date: string
          title: string
        }
        Insert: {
          company: string
          created_at?: string
          currently_working?: boolean
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          profile_id: string
          start_date: string
          title: string
        }
        Update: {
          company?: string
          created_at?: string
          currently_working?: boolean
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          profile_id?: string
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experience_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company: { Args: { _user_id: string }; Returns: string }
      has_company_permission: {
        Args: { _company_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["permission_type"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_article_views: {
        Args: { article_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "job_seeker"
        | "recruiter"
        | "interviewer"
        | "employee"
      application_status:
        | "applied"
        | "under_review"
        | "shortlisted"
        | "rejected"
      company_role: "super_admin" | "hiring_manager" | "recruiter" | "viewer"
      connection_status: "pending" | "accepted" | "rejected"
      job_visibility: "internal" | "external"
      location_type: "onsite" | "hybrid" | "remote"
      permission_type:
        | "create_applicant_profile"
        | "schedule_interview"
        | "view_job_post"
        | "edit_job_post"
        | "remove_job_post"
        | "review_interview_feedback"
        | "submit_interview_feedback"
        | "view_applicant_profile"
        | "post_job"
        | "manage_users"
        | "refer_candidate"
        | "view_all_interviews"
        | "view_own_interviews"
      reaction_type: "like" | "celebrate" | "support" | "insightful" | "love"
      work_type: "contractor" | "permanent" | "intern"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "job_seeker", "recruiter", "interviewer", "employee"],
      application_status: [
        "applied",
        "under_review",
        "shortlisted",
        "rejected",
      ],
      company_role: ["super_admin", "hiring_manager", "recruiter", "viewer"],
      connection_status: ["pending", "accepted", "rejected"],
      job_visibility: ["internal", "external"],
      location_type: ["onsite", "hybrid", "remote"],
      permission_type: [
        "create_applicant_profile",
        "schedule_interview",
        "view_job_post",
        "edit_job_post",
        "remove_job_post",
        "review_interview_feedback",
        "submit_interview_feedback",
        "view_applicant_profile",
        "post_job",
        "manage_users",
        "refer_candidate",
        "view_all_interviews",
        "view_own_interviews",
      ],
      reaction_type: ["like", "celebrate", "support", "insightful", "love"],
      work_type: ["contractor", "permanent", "intern"],
    },
  },
} as const
