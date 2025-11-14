'use client';

import Link, { LinkProps } from 'next/link';
import { useNavigation } from '@/components/providers/navigation-provider';
import { usePathname } from 'next/navigation';
import React from 'react';

type InterceptedLinkProps = LinkProps & React.PropsWithChildren<React.HTMLAttributes<HTMLAnchorElement>>;

export function InterceptedLink({ href, children, onClick, ...props }: InterceptedLinkProps) {
  const { setIsLoading } = useNavigation();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si l'href est le même que la page actuelle, ne rien faire.
    if (href.toString() === pathname) {
       if (onClick) onClick(e); // Exécuter le onClick original s'il existe
       return;
    }
    
    setIsLoading(true);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}