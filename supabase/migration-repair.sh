#!/bin/bash

# Repair the migration history table
supabase migration repair --status applied 20250303000000
