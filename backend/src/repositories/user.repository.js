const prisma = require('../config/prisma');

class UserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        skills: { include: { skill: true } },
      },
    });
  }

  async findById(id, { includeSkills = true, includeRoles = false } = {}) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        ...(includeSkills ? { skills: { include: { skill: true } } } : {}),
        ...(includeRoles ? { rolesPosted: true } : {}),
      },
    });
  }

  async createWithSkills(userData, skillNames = []) {
    return prisma.$transaction(
      async (tx) => {
        const created = await tx.user.create({
          data: {
            email: userData.email,
            passwordHash: userData.passwordHash,
            name: userData.name,
            userType: userData.userType || 'DEVELOPER',
            companyName: userData.companyName || null,
            role: userData.role,
            bio: userData.bio ?? null,
            experienceYears: userData.experienceYears ?? 0,
            phone: userData.phone,
            linkedin: userData.linkedin ?? null,
            github: userData.github ?? null,
            telegram: userData.telegram ?? null,
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

            await tx.userSkill.createMany({
              data: skills.map((s) => ({ userId: created.id, skillId: s.id })),
              skipDuplicates: true,
            });
          }
        }

        return tx.user.findUnique({
          where: { id: created.id },
          include: {
            skills: { include: { skill: true } },
          },
        });
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );
  }

  async updateUser(id, updateData) {
    return prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        skills: { include: { skill: true } },
      },
    });
  }

  async findCandidates(whereClause, { limit = 50, offset = 0 } = {}) {
    return prisma.user.findMany({
      where: whereClause,
      include: {
        skills: { include: { skill: true } },
      },
      skip: offset,
      take: limit,
    });
  }
}

module.exports = new UserRepository();

