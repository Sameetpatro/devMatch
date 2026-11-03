const roleRepository = require('../repositories/role.repository');
const applicationRepository = require('../repositories/application.repository');
const matchRepository = require('../repositories/match.repository');
const userRepository = require('../repositories/user.repository');
const cacheService = require('./cache.service');
const queuePublisher = require('../queues/publisher');
const prisma = require('../config/prisma');
const HttpError = require('../utils/httpError');
const { computeScore } = require('./developer.service');

// Format a role for client consumption
function formatRole(role) {
  if (!role) return null;
  return {
    ...role,
    skills: (role.skills || []).map((rs) => rs.skill?.name || rs),
  };
}

class RoleService {
  async publishRole(recruiterId, roleData) {
    const { skills, ...rest } = roleData;
    const role = await roleRepository.createRole(recruiterId, rest, skills);

    // Invalidate role feeds so all developers discover the new role
    await cacheService.invalidateAllRoleFeeds();

    // Asynchronously dispatch candidate matching background job via RabbitMQ
    queuePublisher
      .publishCandidateMatching({
        roleId: role.id,
        recruiterId,
      })
      .catch((err) => console.warn(`[MatchingQueue] publish failed: ${err.message}`));

    return formatRole(role);
  }

  async getRecruiterRoles(recruiterId) {
    const roles = await roleRepository.findByRecruiter(recruiterId);
    return roles.map(formatRole);
  }

  async getRoleById(roleId) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new HttpError(404, 'Role not found');
    return formatRole(role);
  }

  async updateRole(recruiterId, roleId, updateData) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new HttpError(404, 'Role not found');
    if (role.recruiterId !== Number(recruiterId)) {
      throw new HttpError(403, 'You do not have permission to edit this role');
    }
    const updated = await roleRepository.updateRole(roleId, updateData);
    await cacheService.invalidateAllRoleFeeds();
    return formatRole(updated);
  }

  async getCandidatesForRole(recruiterId, roleId) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new HttpError(404, 'Role not found');
    if (role.recruiterId !== Number(recruiterId)) {
      throw new HttpError(403, 'Forbidden: You do not own this role');
    }

    const roleSkills = (role.skills || []).map((rs) => rs.skill?.name?.toLowerCase() || rs);

    // 1. Applicants who applied for this role
    const applications = await applicationRepository.findByJobRole(roleId);

    const rankedApplicants = applications
      .map((app) => {
        const scoring = computeScore(app.developer, roleSkills);
        const { passwordHash, phone, email, linkedin, github, telegram, ...safeDev } =
          app.developer;

        return {
          applicationId: app.id,
          status: app.status,
          appliedAt: app.createdAt,
          coverLetter: app.coverLetter,
          developer: {
            ...safeDev,
            skills: (app.developer.skills || []).map((us) => us.skill?.name || us),
          },
          scoring,
        };
      })
      .sort((a, b) => b.scoring.score - a.scoring.score);

    return {
      role: formatRole(role),
      applicantCount: applications.length,
      applicants: rankedApplicants,
    };
  }

  async applyToRole(developerId, roleId, coverLetter = null) {
    const devId = Number(developerId);
    const rId = Number(roleId);

    const role = await roleRepository.findById(rId);
    if (!role) throw new HttpError(404, 'Role not found');
    if (role.status !== 'OPEN')
      throw new HttpError(400, 'This role is no longer open for applications');

    // Idempotent upsert via application repository
    const application = await applicationRepository.apply(rId, devId, coverLetter);

    // Invalidate developer feed so applied role disappears from their deck
    await cacheService.invalidateUserFeed(devId);

    // Asynchronously dispatch notification & email to recruiter without blocking HTTP response
    queuePublisher
      .publishNotification({
        userId: role.recruiterId,
        type: 'APPLICATION',
        title: 'New Applicant Received',
        body: `A candidate has applied to your role "${role.title}".`,
        data: { jobRoleId: rId, developerId: devId, applicationId: application.id },
      })
      .catch((err) => console.warn(`[NotificationQueue] publish failed: ${err.message}`));

    if (role.recruiter?.email) {
      queuePublisher
        .publishEmail({
          to: role.recruiter.email,
          subject: `New candidate application for ${role.title}`,
          template: 'NEW_APPLICATION',
          data: {
            candidateName: application.developer?.name || 'A candidate',
            roleTitle: role.title,
          },
        })
        .catch((err) => console.warn(`[EmailQueue] publish failed: ${err.message}`));
    }

    return {
      applicationId: application.id,
      jobRoleId: application.jobRoleId,
      status: application.status,
      appliedAt: application.createdAt,
      message: 'Application submitted successfully',
    };
  }

  async decideApplication(recruiterId, roleId, applicationId, decision) {
    const rId = Number(roleId);
    const appId = Number(applicationId);
    const recId = Number(recruiterId);

    const role = await roleRepository.findById(rId);
    if (!role) throw new HttpError(404, 'Role not found');
    if (role.recruiterId !== recId) {
      throw new HttpError(403, 'You do not have permission to manage applications for this role');
    }

    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: { developer: true },
    });
    if (!app || app.jobRoleId !== rId) {
      throw new HttpError(404, 'Application not found for this role');
    }

    // Atomic transaction for decision and match creation
    const result = await prisma.$transaction(async (tx) => {
      const updatedApp = await applicationRepository.updateStatus(appId, decision, tx);

      let match = null;
      let isMatch = false;

      if (decision === 'ACCEPTED') {
        const [userAId, userBId] = matchRepository.canonicalPair(recId, app.developerId);

        const existingMatch = await matchRepository.findMatch(userAId, userBId, tx);

        match = await matchRepository.createMatch(tx, userAId, userBId, rId);
        isMatch = !existingMatch;
      }

      return {
        applicationId: updatedApp.id,
        status: updatedApp.status,
        decision,
        match,
        isMatch,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    // Asynchronously dispatch match notifications via RabbitMQ
    if (decision === 'ACCEPTED') {
      queuePublisher
        .publishNotification({
          userId: app.developerId,
          type: 'MATCH',
          title: "It's a Connection!",
          body: `Your application for "${role.title}" was accepted! Start chatting now.`,
          data: { matchId: result.match?.id, jobRoleId: rId },
        })
        .catch((err) => console.warn(`[NotificationQueue] publish failed: ${err.message}`));

      if (app.developer?.email) {
        queuePublisher
          .publishEmail({
            to: app.developer.email,
            subject: `You matched for "${role.title}"!`,
            template: 'MATCH_ALERT',
            data: {
              partnerName: role.recruiter?.name || 'Recruiter',
              roleTitle: role.title,
            },
          })
          .catch((err) => console.warn(`[EmailQueue] publish failed: ${err.message}`));
      }
    }

    return result;
  }

  async getPersonalizedRoleFeed(developerId, query = {}) {
    const devId = Number(developerId);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));

    // 1. Check Redis Cache
    const cached = await cacheService.getFeed(devId, query);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // 2. Cache Miss: Fetch & Compute
    const developer = await userRepository.findById(devId, { includeSkills: true });
    if (!developer) throw new HttpError(404, 'Developer profile not found');

    const devSkills = (developer.skills || []).map((us) =>
      (us.skill ? us.skill.name : us).toLowerCase()
    );

    // Exclude roles developer has already applied to
    const appliedRoleIds = await applicationRepository.getAppliedRoleIds(devId);
    const where = {};
    if (appliedRoleIds.length > 0) {
      where.id = { notIn: appliedRoleIds };
    }

    const openRoles = await roleRepository.listOpenRoles(where, { limit: 200 });

    const rankedRoles = openRoles
      .map((role) => {
        const roleSkillsLower = (role.skills || []).map((rs) =>
          (rs.skill ? rs.skill.name : rs).toLowerCase()
        );

        let matchingSkills = 0;
        if (roleSkillsLower.length > 0 && devSkills.length > 0) {
          matchingSkills = roleSkillsLower.filter((s) => devSkills.includes(s)).length;
        }

        const skillMatch =
          roleSkillsLower.length > 0 ? matchingSkills / roleSkillsLower.length : 0;

        const expFit =
          developer.experienceYears >= role.experienceYearsRequired
            ? 1.0
            : Math.max(0, developer.experienceYears / (role.experienceYearsRequired || 1));

        const score = Number((skillMatch * 60 + expFit * 40).toFixed(2));

        return {
          role: formatRole(role),
          scoring: {
            score,
            skillMatch: Number((skillMatch * 100).toFixed(1)),
            matchingSkills,
            requiredSkillsCount: roleSkillsLower.length,
            meetsExperience: developer.experienceYears >= role.experienceYearsRequired,
          },
        };
      })
      .sort((a, b) => b.scoring.score - a.scoring.score);

    const total = rankedRoles.length;
    const start = (page - 1) * limit;
    const slice = rankedRoles.slice(start, start + limit);

    const feedResponse = {
      data: slice,
      meta: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
        developerSkills: devSkills,
      },
      fromCache: false,
    };

    // Store in Redis with 300s (5m) TTL
    await cacheService.setFeed(devId, query, feedResponse, 300);

    return feedResponse;
  }
}

module.exports = new RoleService();
