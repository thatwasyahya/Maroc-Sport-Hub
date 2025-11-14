'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ContactForm() {
  const t = useTranslations('Contact');
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: t('form.successTitle'),
        description: t('form.successDescription'),
      });
      setName('');
      setEmail('');
      setMessage('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>{t('form.title')}</CardTitle>
            <CardDescription>{t('form.description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('form.nameLabel')}</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('form.namePlaceholder')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('form.emailLabel')}</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('form.emailPlaceholder')} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="message">{t('form.messageLabel')}</Label>
                    <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder={t('form.messagePlaceholder')} className="min-h-[150px]" />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t('form.submittingButton') : t('form.submitButton')}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}
