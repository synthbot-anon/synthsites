class LocalDB {
  database;

  constructor() {
    // TODO remove this line
    window.indexedDB.deleteDatabase('Celestia');

    const request = window.indexedDB.open('Celestia', 1);
    request.onerror = (event) => {
      // check if we're trying to load an old version... provide an option to drop and reload
      console.log('database error:', event.target.errorCode);
    };

    request.onsuccess = (event) => {
      this.database = event.target.result;
      console.log('success');
    };

    request.onupgradeneeded = ({ oldVersion, newVersion, target }) => {
      this.database = target.result;

      console.log('oldVersion:', oldVersion);
      console.log('newVersion:', newVersion);

      if (newVersion === 1) {
        const objectStore = this.database.createObjectStore('resources', {
          autoIncrement: true,
        });
        objectStore.createIndex('digest', 'digest', {
          unique: false,
          multientry: false,
        });
        objectStore.createIndex('source', 'source', {
          unique: false,
          multientry: true,
        });
        objectStore.createIndex('type', 'type', { unique: false, multientry: true });
        objectStore.createIndex('name', 'name', { unique: false, multientry: false });
      }
    };

    request.onclose = (event) => {
      console.log('database forcibly closed');
      console.log('event:', event);
    };
  }

  storeFile({ name, content, source, type }) {
    return new Promise((resolve, reject) => {
      content
        .arrayBuffer()
        .then((buffer) => crypto.subtle.digest('sha-256', buffer))
        .then((digestArray) => {
          const digest = new Blob([digestArray], {
            type: 'application/octet-stream',
          });

          const request = this.database
            .transaction(['resources'], 'readwrite')
            .objectStore('resources')
            .add({ name, content, digest, source, type });

          request.onsuccess = ({ target }) => {
            const key = target.result;
            console.log('saved', key, name, digest);
            resolve(key);
          };

          request.onerror = (event) => {
            console.log('error saving', name);
            reject(event);
          };

          request.onabort = (event) => {
            console.log('failed to save', name);
            reject(event);
          };
        });
    });
  }

  updateFile(key, { name, content, source, type }) {
    return new Promise((resolve, reject) => {
      content
        .arrayBuffer()
        .then((buffer) => crypto.subtle.digest('sha-256', buffer))
        .then((digestArray) => {
          const digest = new Blob([digestArray], {
            type: 'application/octet-stream',
          });

          const request = this.database
            .transaction(['resources'], 'readwrite')
            .objectStore('resources')
            .put({ name, content, digest, source, type }, key);

          request.onsuccess = ({ target }) => {
            console.log('saved', key, name, digest);
            resolve(key);
          };

          request.onerror = (event) => {
            console.log('error saving', name);
            reject(event);
          };

          request.onabort = (event) => {
            console.log('failed to save', name);
            reject(event);
          };
        });
    });
  }
}

export default new LocalDB();
