// This file redirects the root path "/" to the default locale "/fr"
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/fr');
}
