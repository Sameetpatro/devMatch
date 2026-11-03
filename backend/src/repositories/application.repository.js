const prisma = require('../config/prisma');

class ApplicationRepository {
  async apply(jobRoleId, developerId, coverLetter = null) {
    return prisma.application.upsert({
      where: {
        jobRoleId_developerId: {
          jobRoleId: Number(jobRoleId),
          developerId: Number(developerId),
        },
      },
      create: {
        jobRoleId: Number(jobRoleId),
        developerId: Number(developerId),
        coverLetter,
        status: 'PENDING',
      },
      update: {
        coverLetter: coverLetter || undefined,
        status: 'PENDING',
      },
      select: {
        id: true,
        jobRoleId: true,
        developerId: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async findByJobAndDeveloper(jobRoleId, developerId) {
    return prisma.application.findUnique({
      where: {
        jobRoleId_developerId: {
          jobRoleId: Number(jobRoleId),
          developerId: Number(developerId),
        },
      },
    });
  }

  async findByJobRole(jobRoleId) {
    return prisma.application.findMany({
      where: { jobRoleId: Number(jobRoleId) },
      orderBy: { createdAt: 'desc' },
      include: {
        developer: {
          include: { skills: { include: { skill: true } } },
        },
      },
    });
  }

  async findByDeveloper(developerId) {
    return prisma.application.findMany({
      where: { developerId: Number(developerId) },
      orderBy: { createdAt: 'desc' },
      include: {
        jobRole: {
          include: {
            skills: { include: { skill: true } },
            recruiter: { select: { id: true, name: true, companyName: true } },
          },
        },
      },
    });
  }

  async updateStatus(id, status, tx = prisma) {
    return tx.application.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        jobRole: true,
        developer: true,
      },
    });
  }

  async getAppliedRoleIds(developerId) {
    const apps = await prisma.application.findMany({
      where: { developerId: Number(developerId) },
      select: { jobRoleId: true },
    });
    return apps.map((a) => a.jobRoleId);
  }
}

module.exports = new ApplicationRepository();

