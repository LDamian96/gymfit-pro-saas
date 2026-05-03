import { PrismaService } from '../../prisma/prisma.service';

/**
 * ADMIN ve todas las sucursales del tenant; el resto (RECEPTIONIST/TRAINER) ve solo
 * la suya. Se mira el primer rol presente en el string compuesto (admin gana siempre).
 */
export function isAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  return role.split(',').map((r) => r.trim()).includes('ADMIN');
}

/**
 * Devuelve el branchId del usuario para aplicar scoping. Para admins devuelve null
 * (sin filtro). Para staff sin sucursal asignada también devuelve null —el caller
 * decide si eso significa "ver todo" o "ver nada".
 */
export async function getScopedBranchId(
  prisma: PrismaService,
  userId: string,
  role: string | undefined,
): Promise<string | null> {
  if (isAdminRole(role)) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { branchId: true },
  });
  return user?.branchId ?? null;
}
