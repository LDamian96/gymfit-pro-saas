import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.fAQ.findMany({
      where: { tenantId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async create(dto: CreateFaqDto, tenantId: string) {
    return this.prisma.fAQ.create({
      data: { ...dto, tenantId },
    });
  }

  async update(id: string, dto: Partial<CreateFaqDto>, tenantId: string) {
    const faq = await this.prisma.fAQ.findFirst({ where: { id, tenantId } });
    if (!faq) throw new NotFoundException('Pregunta no encontrada');
    return this.prisma.fAQ.update({ where: { id }, data: dto });
  }

  async remove(id: string, tenantId: string) {
    const faq = await this.prisma.fAQ.findFirst({ where: { id, tenantId } });
    if (!faq) throw new NotFoundException('Pregunta no encontrada');
    await this.prisma.fAQ.update({ where: { id }, data: { isActive: false } });
    return null;
  }
}
