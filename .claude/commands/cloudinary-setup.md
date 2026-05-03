# Setup Cloudinary para Imágenes

Configura Cloudinary para upload/delete de imágenes. SIEMPRE responde en español.

## Archivos
```
config/cloudinary.config.ts    # Provider de Cloudinary
modules/upload/
├── upload.module.ts
├── upload.controller.ts       # POST /api/v1/upload/image
├── upload.service.ts          # Upload a Cloudinary, retorna URL
└── dto/upload.dto.ts
```

## Funcionalidad
- Upload imagen con multer (memory storage)
- Transformaciones: resize, crop, format webp
- Folders por tenant: `gymfit/<tenantId>/<tipo>/`
- Tipos: avatar, exercise, facility, landing, proof
- Delete imagen por public_id
- Límite: 5MB por imagen

## Variables de Entorno
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## NUNCA
- Guardar imágenes localmente
- Aceptar archivos mayores a 5MB
- Permitir upload sin autenticación
