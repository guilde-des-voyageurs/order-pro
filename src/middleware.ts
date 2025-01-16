import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Liste des routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('__session');
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Si c'est une route publique et que l'utilisateur est connecté, rediriger vers la page d'accueil
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si ce n'est pas une route publique et que l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
