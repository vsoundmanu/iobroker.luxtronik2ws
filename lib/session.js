'use strict';

class Session {

    constructor() {
        this.clear();
    }

    clear() {
        this.navigation = new Map();
    }

    addNavigation(name, id) {
        this.navigation.set(name, id);
    }

    getNavigationId(name) {
        return this.navigation.get(name);
    }

    getNavigationEntries() {
        return Array.from(this.navigation.entries()).map(([name, id]) => ({
            name,
            id
        }));
    }

}

module.exports = Session;
