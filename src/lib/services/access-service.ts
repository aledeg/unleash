import { throws } from 'assert';
import { AccessStore, Role, Permission } from '../db/access-store';
import p from '../permissions';
import User from '../user';

const { ADMIN } = p;

const PROJECT_ADMIN = [
    p.UPDATE_PROJECT,
    p.DELETE_PROJECT,
    p.CREATE_FEATURE,
    p.UPDATE_FEATURE,
    p.DELETE_FEATURE,
];

const PROJECT_REGULAR = [p.CREATE_FEATURE, p.UPDATE_FEATURE, p.DELETE_FEATURE];

const isProjectPermission = permission => PROJECT_ADMIN.includes(permission);

interface Stores {
    accessStore: AccessStore;
    userStore: any;
}

// Can replace this with a tuple?
interface RoleUsers {
    role: Role;
    users: User[];
}

export interface UserWithRole {
    id: number;
    roleId: number;
    name?: string
    username?: string;
    email?: string;
    imageUrl?: string;
}

interface RoleData {
    role: Role;
    users: User[];
    permissions: Permission[];
}

interface IPermission {
    name: string;
    type: PermissionType;
}

enum PermissionType {
    root='root',
    project='project',
}


// TODO: Split this in two concerns. 1: Controlling access, 2: managing roles (rbac).
export class AccessService {
    private store: AccessStore;

    private userStore: any;

    private logger: Function;

    private permissions: IPermission[];

    constructor({ accessStore, userStore }: Stores, { getLogger } : { getLogger: Function}) {
        this.store = accessStore;
        this.userStore = userStore;
        this.logger = getLogger('/services/access-service.ts');
        this.permissions = Object.values(p).map(p => ({
            name: p,
            type: isProjectPermission(p) ? PermissionType.project : PermissionType.root
        }))
    }

    async hasPermission(user: User, permission: string, projectName?: string): Promise<boolean> {
        const permissions = await this.store.getPermissionsForUser(user.id);
        return permissions
            .filter(p => !p.project || p.project === projectName)
            .some(p => p.permission === permission || p.permission === ADMIN);
    }

    getPermissions(): IPermission[] {
        return this.permissions;
    }

    async addUserToRole(userId: number, roleId: number) {
        return this.store.addUserToRole(userId, roleId);
    }

    async removeUserFromRole(userId: number, roleId: number) {
        return this.store.removeUserFromRole(userId, roleId);
    }

    async addPermissionToRole(roleId: number, permission: string, projectName?: string) {
        if(isProjectPermission(permission) && !projectName) {
            throw new Error('You must define a project.')
        } 
        return this.store.addPermissionsToRole(roleId, [permission], projectName);
    }

    async removePermissionFromRole(roleId: number, permission: string, projectName?: string) {
        if(isProjectPermission(permission) && !projectName) {
            throw new Error('You must define a project.')
        }
        return this.store.removePermissionFromRole(roleId, permission, projectName);
    }

    async getRoles(): Promise<Role[]> {
        return this.store.getRoles();
    }

    async getRole(roleId: number): Promise<RoleData> {
        const [role, permissions, users] = await Promise.all([
            this.store.getRoleWithId(roleId),
            this.store.getPermissionsForRole(roleId),
            this.getUsersForRole(roleId),
        ]);
        return { role, permissions, users };
    }

    async getRolesForProject(projectName: string): Promise<Role[]> {
        return this.store.getRolesForProject(projectName);
    }

    async getRolesForUser(user: User): Promise<Role[]> {
        return this.store.getRolesForUserId(user.id);
    }

    async getRoleUsers(roleId) : Promise<RoleUsers> {
        const [role, users] = await Promise.all([
            this.store.getRoleWithId(roleId), 
            this.getUsersForRole(roleId)]);
        return {role, users}
    }

    async getUsersForRole(roleId) : Promise<User[]> {
        const userIdList = await this.store.getUserIdsForRole(roleId);
        return this.userStore.getAllWithId(userIdList);
    }

    // Move to project-service?
    async getProjectRoleUsers(projectName: string): Promise<[Role[], UserWithRole[]]> {
        const roles = await this.store.getRolesForProject(projectName);

        const users = await Promise.all(roles.map(async role => {
            const users = await this.getUsersForRole(role.id);
            return users.map(u => ({ ...u, roleId: role.id }))
        }));
        return [roles, users.flat()];
    }

    async createDefaultProjectRoles(owner: User, projectId: string) {
        if(!projectId) {
            throw new Error("ProjectId cannot be empty");
        }

        const adminRole = await this.store.createRole(
            `Admin`,
            'project-admin', //TODO: constant
            projectId,
            `Admin role for project = ${projectId}`,
        );
        await this.store.addPermissionsToRole(
            adminRole.id,
            PROJECT_ADMIN,
            projectId,
        );

        // TODO: remove this when all users is guaranteed to have a unique id. 
        if (owner.id) {
            this.store.addUserToRole(owner.id, adminRole.id);    
        };
        

        const regularRole = await this.store.createRole(
            `Regular`,
            'project-regular',  //TODO: constant
            projectId,
            `Contributor role for project = ${projectId}`,
        );
        await this.store.addPermissionsToRole(
            regularRole.id,
            PROJECT_REGULAR,
        );
    }
}
