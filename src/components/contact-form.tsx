'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ContactFormProps {
  translations: {
    title: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButton: string;
    submittingButton: string;
    successTitle: string;
    successDescription: string;
  };
}

export default function ContactForm({ translations }: ContactFormProps) {
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
        title: translations.successTitle,
        description: translations.successDescription,
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
        <CardTitle>{translations.title}</CardTitle>
        <CardDescription>{translations.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{translations.nameLabel}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder={translations.namePlaceholder} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{translations.emailLabel}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={translations.emailPlaceholder} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{translations.messageLabel}</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder={translations.messagePlaceholder} className="min-h-[150px]" />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? translations.submittingButton : translations.submitButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
