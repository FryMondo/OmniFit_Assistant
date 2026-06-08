import {createClient} from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Увага: SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY відсутні у файлі .env');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);