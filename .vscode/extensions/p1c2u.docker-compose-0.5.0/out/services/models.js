'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
class Service {
    constructor(project, name, dockerExecutor, composeExecutor) {
        this.project = project;
        this.name = name;
        this.dockerExecutor = dockerExecutor;
        this.composeExecutor = composeExecutor;
        this._containers = undefined;
    }
    async getContainers(force = false) {
        if (this._containers === undefined || force) {
            await this.refreshContainers();
        }
        return this._containers;
    }
    async _getContainers(force = false) {
        let containers = await this.project.getContainers(force);
        let projectPattern = this.project.name + '-';
        let servicePattern = projectPattern + this.name + '-';
        return containers.filter((container) => {
            // standard container name
            if (container.name.startsWith(projectPattern)) {
                return container.name.includes(servicePattern);
                // custom container name
            }
            else {
                let name = this.getContainerServiceName(container.name);
                return name == this.name;
            }
        });
    }
    getContainerServiceName(name) {
        let options = { projectName: this.project.name, containerName: name, ProjectDir: this.project.cwd };
        let resultString = this.dockerExecutor.getPs(options);
        let linesString = resultString.split(/[\r\n]+/g).filter((item) => item);
        return linesString[0];
    }
    async refreshContainers() {
        this._containers = await this._getContainers(true);
    }
    shell() {
        this.composeExecutor.shell(this.name);
    }
    up() {
        return this.composeExecutor.up(this.name);
    }
    down() {
        return this.composeExecutor.down(this.name);
    }
    start() {
        return this.composeExecutor.start(this.name);
    }
    stop() {
        return this.composeExecutor.stop(this.name);
    }
    restart() {
        return this.composeExecutor.restart(this.name);
    }
    build() {
        return this.composeExecutor.build(this.name);
    }
    kill() {
        return this.composeExecutor.kill(this.name);
    }
}
exports.Service = Service;
//# sourceMappingURL=models.js.map