'use client';

import React, { useCallback, useEffect } from 'react';
import NextLink from 'next/link';
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from 'next/navigation';

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string;
  href?: string;
  replace?: boolean;
  state?: any;
}

export function Link({ to, href, replace, className, children, onClick, ...props }: LinkProps) {
  const target = to || href || '#';
  return (
    <NextLink href={target} replace={replace} className={className} onClick={onClick} {...props}>
      {children}
    </NextLink>
  );
}

export interface NavLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> {
  to?: string;
  href?: string;
  className?: string | ((props: { isActive: boolean }) => string);
  replace?: boolean;
}

export function NavLink({ to, href, className, children, replace, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const target = to || href || '';
  const isActive = pathname === target || (target !== '/' && pathname?.startsWith(target));
  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <NextLink href={target} replace={replace} className={resolvedClass} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to: string | number, options?: { replace?: boolean; state?: any }) => {
      if (typeof to === 'number') {
        if (typeof window !== 'undefined') {
          if (to === -1) window.history.back();
          else window.history.go(to);
        }
        return;
      }

      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router],
  );
}

export function useParams<T extends Record<string, string | string[] | undefined> = Record<string, string>>(): T {
  const params = useNextParams();
  return (params ?? {}) as T;
}

export function useLocation() {
  const pathname = usePathname() ?? '/';
  const search = typeof window !== 'undefined' ? window.location?.search ?? '' : '';

  return {
    pathname,
    search,
    state: typeof window !== 'undefined' ? window.history?.state?.usr ?? null : null,
    hash: typeof window !== 'undefined' ? window.location?.hash ?? '' : '',
    key: 'default',
  };
}

export function useSearchParams() {
  const nextSearchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback(
    (nextParams: URLSearchParams | Record<string, string>) => {
      const qs =
        nextParams instanceof URLSearchParams
          ? nextParams.toString()
          : new URLSearchParams(nextParams).toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`);
    },
    [pathname, router],
  );

  return [nextSearchParams ?? new URLSearchParams(), setSearchParams] as const;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean; state?: any }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);

  return null;
}

export function Outlet() {
  return null;
}

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Route({ element }: { path?: string; element?: React.ReactNode }) {
  return <>{element}</>;
}
