'use client';

import RequestsList from '@/components/dashboard/RequestsList';
import {unstable_setRequestLocale} from 'next-intl/server';

export default function RequestsPage({ params: { locale } }: { params: { locale: string } }) {
    unstable_setRequestLocale(locale);
    return (
      <div className="space-y-6">
        <RequestsList />
      </div>
    );
}
