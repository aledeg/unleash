'use strict';

const Controller = require('../controller');

// const extractUser = require('../../extract-user');
const { handleErrors } = require('./util');
const p = require('../../permissions');

// TODO 1: probably move part of this to enterprise
// TODO 2: probably move to enterprise
class RbacController extends Controller {
    constructor(config, { accessService }) {
        super(config);
        this.logger = config.getLogger('/admin-api/addon.js');
        this.accessService = accessService;

        this.get('/permissions', this.getPermissions, p.READ_ROLE);
        this.get('/roles', this.getRoles, p.READ_ROLE);
        this.get('/roles/:roleId', this.getRole, p.READ_ROLE);
        this.post(
            '/roles/:roleId/users/:userId',
            this.addUserToRole,
            p.UPDATE_ROLE,
        );
        this.delete(
            '/roles/:roleId/users/:userId',
            this.removeUserFromRole,
            p.UPDATE_ROLE,
        );
        this.post(
            '/roles/:roleId/permissions/:permission',
            this.addPermissionToRole,
            p.UPDATE_ROLE,
        );
        this.delete(
            '/roles/:roleId/permissions/:permission',
            this.removePermissionFromRole,
            p.UPDATE_ROLE,
        );
    }

    async getPermissions(req, res) {
        const permissions = this.accessService.getPermissions();
        res.json({ permissions });
    }

    async getRoles(req, res) {
        try {
            const roles = await this.accessService.getRoles();
            res.json({ roles });
        } catch (error) {
            handleErrors(res, this.logger, error);
        }
    }

    async getRole(req, res) {
        const { roleId } = req.params;
        try {
            const role = await this.accessService.getRole(roleId);
            res.json({ role });
        } catch (error) {
            handleErrors(res, this.logger, error);
        }
    }

    async addUserToRole(req, res) {
        const { userId, roleId } = req.params;
        try {
            const role = await this.accessService.addUserToRole(userId, roleId);
            res.json({ role });
        } catch (error) {
            handleErrors(res, this.logger, error);
        }
    }

    async removeUserFromRole(req, res) {
        const { userId, roleId } = req.params;
        try {
            const role = await this.accessService.removeUserFromRole(
                userId,
                roleId,
            );
            res.json({ role });
        } catch (error) {
            handleErrors(res, this.logger, error);
        }
    }

    async addPermissionToRole(req, res) {
        res.status(400).send('not implemented yet');
    }

    async removePermissionFromRole(req, res) {
        res.status(400).send('not implemented yet');
    }
}

module.exports = RbacController;
