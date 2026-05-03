# Referencia Completa de API (FUENTE DE VERDAD)

Lista TODOS los endpoints del sistema. ANTES de consumir una API, consultar aquí. SIEMPRE responde en español.

## Formato
Cada endpoint lista: Método, Ruta, Rol requerido, Body/Query, Response exacta.

## Auth
| Método | Ruta | Rol | Body | Response |
|--------|------|-----|------|----------|
| POST | /api/v1/auth/register | Public | { email, password, firstName, lastName, gymName } | { success, data: { user, tenant } } |
| POST | /api/v1/auth/login | Public | { email, password } | Set-Cookie + { success, data: { user } } |
| POST | /api/v1/auth/refresh | Auth | — | Set-Cookie + { success } |
| POST | /api/v1/auth/logout | Auth | — | Clear-Cookie + { success } |
| GET | /api/v1/auth/me | Auth | — | { success, data: { user } } |

## Members
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/members | Admin,Recep | ?page&limit&search&status | PaginatedResponse<MemberResponse> |
| GET | /api/v1/members/:id | Admin,Recep,Trainer | — | ApiResponse<MemberResponse> |
| POST | /api/v1/members | Admin,Recep | CreateMemberRequest | ApiResponse<MemberResponse> |
| PATCH | /api/v1/members/:id | Admin | UpdateMemberRequest | ApiResponse<MemberResponse> |
| DELETE | /api/v1/members/:id | Admin | — | ApiResponse<null> |

## Staff
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/staff | Admin | ?page&limit&search&role | PaginatedResponse<StaffResponse> |
| POST | /api/v1/staff | Admin | CreateStaffRequest | ApiResponse<StaffResponse> |
| PATCH | /api/v1/staff/:id | Admin | UpdateStaffRequest | ApiResponse<StaffResponse> |
| DELETE | /api/v1/staff/:id | Admin | — | ApiResponse<null> |

## Payments
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/payments | Admin | ?page&limit&memberId&status&method&dateFrom&dateTo | PaginatedResponse<PaymentResponse> |
| POST | /api/v1/payments | Admin,Recep | CreatePaymentRequest | ApiResponse<PaymentResponse> |
| PATCH | /api/v1/payments/:id/status | Admin | { status } | ApiResponse<PaymentResponse> |

## Routines
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/routines | Trainer | ?memberId | ApiResponse<RoutineResponse[]> |
| GET | /api/v1/routines/:id | Trainer,Client | — | ApiResponse<RoutineDetailResponse> |
| POST | /api/v1/routines | Trainer | CreateRoutineRequest | ApiResponse<RoutineResponse> |
| PATCH | /api/v1/routines/:id | Trainer | UpdateRoutineRequest | ApiResponse<RoutineResponse> |
| DELETE | /api/v1/routines/:id | Trainer | — | ApiResponse<null> |

## Classes
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/classes | Auth | ?dayOfWeek&instructorId | ApiResponse<ClassResponse[]> |
| POST | /api/v1/classes | Admin | CreateClassRequest | ApiResponse<ClassResponse> |
| PATCH | /api/v1/classes/:id | Admin | UpdateClassRequest | ApiResponse<ClassResponse> |
| DELETE | /api/v1/classes/:id | Admin | — | ApiResponse<null> |
| POST | /api/v1/classes/:id/book | Client | { date } | ApiResponse<BookingResponse> |
| DELETE | /api/v1/classes/:id/book/:bookingId | Client | — | ApiResponse<null> |

## Check-in
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| POST | /api/v1/checkin | Recep | { qrCode } | ApiResponse<CheckInResponse> |
| GET | /api/v1/checkin/today | Recep,Admin | — | ApiResponse<CheckInResponse[]> |

## Progress
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/progress/:memberId | Trainer,Client | — | ApiResponse<ProgressResponse[]> |
| POST | /api/v1/progress | Trainer | CreateProgressRequest | ApiResponse<ProgressResponse> |

## Gamification
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/gamification | Admin | — | ApiResponse<GamificationResponse[]> |
| POST | /api/v1/gamification | Admin | CreateGamificationRequest | ApiResponse<GamificationResponse> |
| PATCH | /api/v1/gamification/:id | Admin | UpdateGamificationRequest | ApiResponse<GamificationResponse> |
| GET | /api/v1/gamification/member/:memberId | Auth | — | ApiResponse<MemberAchievementResponse[]> |

## Landing (contenido público)
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/landing/:slug | Public | — | ApiResponse<LandingContentResponse> |
| GET | /api/v1/landing/:slug/services | Public | — | ApiResponse<LandingServiceResponse[]> |
| GET | /api/v1/landing/:slug/plans | Public | — | ApiResponse<PlanResponse[]> |
| GET | /api/v1/landing/:slug/facilities | Public | — | ApiResponse<FacilityResponse[]> |
| GET | /api/v1/landing/:slug/classes | Public | — | ApiResponse<ClassPublicResponse[]> |
| GET | /api/v1/landing/:slug/faq | Public | — | ApiResponse<FAQResponse[]> |

## Landing Admin (gestión)
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/admin/landing | Admin | — | ApiResponse<LandingContentResponse> |
| PATCH | /api/v1/admin/landing | Admin | UpdateLandingRequest | ApiResponse<LandingContentResponse> |
| CRUD | /api/v1/admin/services | Admin | — | Estándar CRUD |
| CRUD | /api/v1/admin/plans | Admin | — | Estándar CRUD |
| CRUD | /api/v1/admin/facilities | Admin | — | Estándar CRUD |
| CRUD | /api/v1/admin/faq | Admin | — | Estándar CRUD |

## Upload
| Método | Ruta | Rol | Body | Response |
|--------|------|-----|------|----------|
| POST | /api/v1/upload/image | Auth | multipart/form-data (file, folder) | ApiResponse<{ url, publicId }> |
| DELETE | /api/v1/upload/image/:publicId | Auth | — | ApiResponse<null> |

## Dashboard Stats
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/dashboard/stats | Admin | — | ApiResponse<DashboardStatsResponse> |
| GET | /api/v1/dashboard/recent-activity | Admin | — | ApiResponse<ActivityResponse[]> |

## Branches
| Método | Ruta | Rol | Body/Query | Response |
|--------|------|-----|------------|----------|
| GET | /api/v1/branches | Admin | — | ApiResponse<BranchResponse[]> |
| POST | /api/v1/branches | Admin | CreateBranchRequest | ApiResponse<BranchResponse> |
| POST | /api/v1/branches/transfer | Admin | { staffId, toBranchId } | ApiResponse<null> |

## REGLA: Antes de hacer fetch en el frontend, BUSCAR la ruta exacta en esta lista.
