import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useLixiLogic = () => {
    const [remainingEnvelopes, setRemainingEnvelopes] = useState<number>(100);

    useEffect(() => {
        const fetchRemaining = async () => {
            const { count } = await supabase
                .from('lixi_consultant_slots')
                .select('slot_number', { count: 'exact', head: true })
                .is('claimed_by', null);
            if (count !== null) setRemainingEnvelopes(count);
        };
        fetchRemaining();
    }, []);

    return { remainingEnvelopes };
};
