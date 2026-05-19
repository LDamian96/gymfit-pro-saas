import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas agrupadas por permiso de rol.
// Si un rol no está en la lista de la ruta, se redirige a su pantalla inicial.
// El backend además rechaza datos (403/401), pero este middleware previene
// que la PÁGINA misma se renderice — más limpio para UX y seguridad superficial.

const ADMIN_ONLY = [
  '/dashboard',
  '/staff',
  '/branches',
  '/shop',
  '/brands',
  '/product-categories',
  '/settings',
  '/landing',
  '/gamification',
];

const ADMIN_TRAINER = ['/exercises', '/muscle-groups', '/routines'];
const ADMIN_RECEP = ['/checkin'];
// /finances (Membresías): el sidebar muestra el link según setting del tenant;
// el backend valida el permiso real. El middleware solo deja pasar a staff.
const ALL_STAFF = ['/members', '/classes', '/pos', '/sales', '/finances'];
const CLIENT_ROUTES = [
  '/my-progress',
  '/my-routines',
  '/my-measurements',
  '/my-attendance',
  '/my-schedule',
  '/my-profile',
];

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/dashboard',
  TRAINER: '/routines',
  RECEPTIONIST: '/checkin',
  CLIENT: '/my-progress',
};

type RoleKey = 'ADMIN' | 'TRAINER' | 'RECEPTIONIST' | 'CLIENT';

interface JwtPayload { role?: string; exp?: number }

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    // base64url → base64 + padding (atob requiere padding correcto)
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    // atob existe en Edge Runtime (Buffer no)
    const json = JSON.parse(decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    ));
    return json as JwtPayload;
  } catch { return null; }
}

function startsWithAny(path: string, list: string[]): boolean {
  return list.some((r) => path === r || path.startsWith(r + '/'));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lista combinada de rutas controladas. Si la ruta NO está acá, dejar pasar.
  const isControlled =
    startsWithAny(pathname, ADMIN_ONLY) ||
    startsWithAny(pathname, ADMIN_TRAINER) ||
    startsWithAny(pathname, ADMIN_RECEP) ||
    startsWithAny(pathname, ALL_STAFF) ||
    startsWithAny(pathname, CLIENT_ROUTES);
  if (!isControlled) return NextResponse.next();

  const token = req.cookies.get('access_token')?.value;
  let rolesFromAuth: string = '';

  if (token) {
    const decoded = decodeJwt(token);
    rolesFromAuth = decoded?.role || '';
  } else {
    // AUTH OPTIMISTA — si access_token no existe pero auth_pending=1 y user_meta presente,
    // el cliente está en transición de login. Permitir paso temporal usando rol de user_meta.
    // Esto deja que el panel se vea INSTANT, mientras el access_token real se asienta.
    const pending = req.cookies.get('auth_pending')?.value;
    const userMeta = req.cookies.get('user_meta')?.value;
    if (pending === '1' && userMeta) {
      try {
        const obj = JSON.parse(decodeURIComponent(userMeta)) as { role?: string };
        rolesFromAuth = obj.role || '';
      } catch { rolesFromAuth = ''; }
    }
    if (!rolesFromAuth) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  const roles = rolesFromAuth.split(',').map((r) => r.trim()) as RoleKey[];
  const isAdmin = roles.includes('ADMIN');
  const isTrainer = roles.includes('TRAINER');
  const isRecep = roles.includes('RECEPTIONIST');
  const isClient = roles.includes('CLIENT');

  let allowed = false;
  if (startsWithAny(pathname, CLIENT_ROUTES)) {
    allowed = isClient || isAdmin;
  } else if (startsWithAny(pathname, ADMIN_ONLY)) {
    allowed = isAdmin;
  } else if (startsWithAny(pathname, ADMIN_TRAINER)) {
    allowed = isAdmin || isTrainer;
  } else if (startsWithAny(pathname, ADMIN_RECEP)) {
    allowed = isAdmin || isRecep;
  } else if (startsWithAny(pathname, ALL_STAFF)) {
    allowed = isAdmin || isTrainer || isRecep;
  }

  if (!allowed) {
    // Encontrar la home según el primer rol que tenga.
    let home = '/login';
    for (const r of roles) {
      if (ROLE_HOME[r]) { home = ROLE_HOME[r]; break; }
    }
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Excluir API routes, assets estáticos y archivos del sistema.
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
