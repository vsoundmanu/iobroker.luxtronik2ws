'use strict';

class Session {

    constructor() {
        this.clear();
    }

    clear() {
        this.navigation = new Map();
        this.items = new Map();
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

    addItem(name, id) {
        this.items.set(name, id);
    }

    getItemId(name) {
        return this.items.get(name);
    }

}

module.exports = Session;