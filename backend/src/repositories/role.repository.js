const prisma = require('../config/prisma');

class RoleRepository {
  async createRole(recruiterId, roleData, skillNames = []) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.jobRole.create({
        data: {
          recruiterId,
          title: roleData.title,
          companyName: roleData.companyName,
          description: roleData.description,
          location: roleData.location ?? null,
          isRemote: roleData.isRemote ?? true,
          experienceYearsRequired: roleData.experienceYearsRequired ?? 0,
          salaryRange: roleData.salaryRange ?? null,
          status: roleData.status || 'OPEN',
        },
      });

      if (skillNames && skillNames.length > 0) {
        const normalized = [...new Set(skillNames.map((s) => s.trim()).filter(Boolean))];
        if (normalized.length > 0) {
          await tx.skill.createMany({
            data: normalized.map((name) => ({ name })),
            skipDuplicates: true,
          });

          const skills = await tx.skill.findMany({
            where: { name: { in: normalized } },
            select: { id: true },
          });

          await tx.roleSkill.createMany({
            data: skills.map((s) => ({ roleId: role.id, skillId: s.id })),
            skipDuplicates: true,
          });
        }
      }

      return tx.jobRole.findUnique({
        where: { id: role.id },
        include: {
          skills: { include: { skill: true } },
          recruiter: {
            select: { id: true, name: true, email: true, companyName: true },
          },
        },
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  async findById(id) {
    return prisma.jobRole.findUnique({
      where: { id: Number(id) },
      include: {
        skills: { include: { skill: true } },
        recruiter: {
          select: { id: true, name: true, email: true, companyName: true, phone: true },
        },
      },
    });
  }

  async findByRecruiter(recruiterId) {
    return prisma.jobRole.findMany({
      where: { recruiterId: Number(recruiterId) },
      orderBy: { createdAt: 'desc' },
      include: {
        skills: { include: { skill: true } },
        _count: {
          select: { applications: true, matches: true },
        },
      },
    });
  }

  async listOpenRoles(filters = {}, { limit = 50, offset = 0 } = {}) {
    const where = { status: 'OPEN', ...filters };

    return prisma.jobRole.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        skills: { include: { skill: true } },
        recruiter: {
          select: { id: true, name: true, companyName: true },
        },
      },
      skip: offset,
      take: limit,
    });
  }

  async updateRole(id, updateData) {
    return prisma.jobRole.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        skills: { include: { skill: true } },
      },
    });
  }

  async deleteRole(id) {
    return prisma.jobRole.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = new RoleRepository();

