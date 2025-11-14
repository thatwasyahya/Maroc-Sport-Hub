'use client';

import RequestsList from '@/components/dashboard/RequestsList';
import {unstable_setRequestLocale} from 'next-intl/server';

export default function RequestsPage({params}: {params: {locale: string}}) {
    unstable_setRequestLocale(params.locale);
    return (
      <div className="space-y-6">
        <RequestsList />
      </div>
    );
}
