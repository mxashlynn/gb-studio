import uuid from "uuid/v4";

const mapValues = (obj, fn) =>
  Object.entries(obj).reduce((memo, [key, value]) => {
    return {
      ...memo,
      [key]: fn(value, key, obj)
    };
  }, {});

const mapEvents = (events = [], callback) => {
  return events.map(event => {
    if (event.children) {
      const newEvent = callback(event);
      return {
        ...newEvent,
        children: mapValues(newEvent.children || event.children, childEvents =>
          mapEvents(childEvents, callback)
        )
      };
    }
    return callback(event);
  });
};

const mapScenesEvents = (scenes, callback) => {
  return scenes.map(scene => {
    return mapSceneEvents(scene, callback);
  });
};

const mapSceneEvents = (scene, callback) => {
  return {
    ...scene,
    script: mapEvents(scene.script, callback),
    playerHit1Script: mapEvents(scene.playerHit1Script, callback),
    playerHit2Script: mapEvents(scene.playerHit2Script, callback),
    playerHit3Script: mapEvents(scene.playerHit3Script, callback),    
    actors: scene.actors.map(actor => {
      return {
        ...actor,
        script: mapEvents(actor.script, callback),
        startScript: mapEvents(actor.startScript, callback),
        hit1Script: mapEvents(actor.hit1Script, callback),
        hit2Script: mapEvents(actor.hit2Script, callback),
        hit3Script: mapEvents(actor.hit3Script, callback)
      };
    }),
    triggers: scene.triggers.map(trigger => {
      return {
        ...trigger,
        script: mapEvents(trigger.script, callback)
      };
    })
  };
};

const walkEvents = (events = [], callback) => {
  for (let i = 0; i < events.length; i++) {
    callback(events[i]);
    if (events[i].children) {
      Object.keys(events[i].children).forEach(key => {
        walkEvents(events[i].children[key], callback);
      });
    }
  }
};

const walkEventsDepthFirst = (events = [], callback) => {
  for (let i = 0; i < events.length; i++) {
    if (events[i].children) {
      Object.keys(events[i].children).forEach(key => {
        walkEvents(events[i].children[key], callback);
      });
    }
    callback(events[i]);
  }
};

const walkScenesEvents = (scenes, callback) => {
  scenes.forEach(scene => {
    walkSceneEvents(scene, callback);
  });
};

const walkSceneEvents = (scene, callback) => {
  walkEvents(scene.script, callback);
  walkEvents(scene.playerHit1Script, callback);
  walkEvents(scene.playerHit2Script, callback);
  walkEvents(scene.playerHit3Script, callback);

  scene.actors.forEach(actor => {
    walkEvents(actor.script, callback);
    walkEvents(actor.startScript, callback);
    walkEvents(actor.updateScript, callback);
    walkEvents(actor.hit1Script, callback);
    walkEvents(actor.hit2Script, callback);
    walkEvents(actor.hit3Script, callback);
  });
  scene.triggers.forEach(trigger => {
    walkEvents(trigger.script, callback);
  });
};

const normalizedWalkSceneEvents = (
  scene,
  actorsLookup,
  triggersLookup,
  callback
) => {
  walkEvents(scene.script, callback);
  walkEvents(scene.playerHit1Script, callback);
  walkEvents(scene.playerHit2Script, callback);
  walkEvents(scene.playerHit3Script, callback);

  scene.actors.forEach(actorId => {
    const actor = actorsLookup[actorId];
    walkEvents(actor.script, callback);
    walkEvents(actor.script, callback);
    walkEvents(actor.startScript, callback);
    walkEvents(actor.updateScript, callback);
    walkEvents(actor.hit1Script, callback);
    walkEvents(actor.hit2Script, callback);
    walkEvents(actor.hit3Script, callback);
  });
  scene.triggers.forEach(triggerId => {
    walkEvents(triggersLookup[triggerId].script, callback);
  });
};

const normalizedFindSceneEvent = (
  scene,
  actorsLookup,
  triggersLookup,
  callback
) => {
  let event = null;
  let fn = callback;
  if (typeof fn === "string") {
    const id = fn;
    fn = walkEvent => {
      return walkEvent.id === id;
    };
  }
  try {
    normalizedWalkSceneEvents(
      scene,
      actorsLookup,
      triggersLookup,
      walkEvent => {
        if (fn(walkEvent)) {
          event = walkEvent;
          throw new Error("FOUND_EVENT");
        }
      }
    );
  } catch (err) {
    if (event) {
      return event;
    }
    throw err;
  }
  return event;
};

const findSceneEvent = (scene, callback) => {
  let event = null;
  let fn = callback;
  if (typeof fn === "string") {
    const id = fn;
    fn = walkEvent => {
      return walkEvent.id === id;
    };
  }
  try {
    walkSceneEvents(scene, walkEvent => {
      if (fn(walkEvent)) {
        event = walkEvent;
        throw new Error("FOUND_EVENT");
      }
    });
  } catch (err) {
    if (event) {
      return event;
    }
    throw err;
  }
  return event;
};

const patchEvents = (data, id, patch) => {
  return data.reduce((memo, o) => {
    return [].concat(
      memo,
      Object.assign(
        {},
        o,
        o.children && {
          children: mapValues(o.children, childEvents =>
            patchEvents(childEvents, id, patch)
          )
        },
        o.id === id && {
          args: {
            ...o.args,
            ...patch
          }
        }
      )
    );
  }, []);
};

const prependEvent = (data, id, newData) => {
  return data.reduce((memo, o) => {
    return [].concat(
      memo,
      o.id === id ? newData : [],
      Object.assign(
        {},
        o,
        o.children && {
          children: mapValues(o.children, childEvents =>
            prependEvent(childEvents, id, newData)
          )
        }
      )
    );
  }, []);
};

const appendEvent = (data, id, newData) => {
  return data.reduce((memo, o) => {
    return [].concat(
      memo,
      Object.assign(
        {},
        o,
        o.children && {
          children: mapValues(o.children, childEvents =>
            appendEvent(childEvents, id, newData)
          )
        }
      ),
      o.id === id ? newData : []
    );
  }, []);
};

const removeEventIds = event => {
  return Object.assign(
    {},
    event,
    {
      id: undefined
    },
    event.children && {
      children: mapValues(event.children, childEvents =>
        childEvents.map(removeEventIds)
      )
    }
  );
};

const regenerateEventIds = event => {
  return Object.assign(
    {},
    event,
    {
      id: uuid()
    },
    event.children && {
      children: mapValues(event.children, childEvents =>
        childEvents.map(regenerateEventIds)
      )
    }
  );
};

const filterEvents = (data, id) => {
  return data.reduce((memo, o) => {
    if (o.id !== id) {
      memo.push({
        ...o,
        children:
          o.children &&
          mapValues(o.children, childEvents => filterEvents(childEvents, id))
      });
    }
    return memo;
  }, []);
};

const findEvent = (data, id) => {
  let r = null;
  for (let i = 0; i < data.length; i++) {
    const o = data[i];
    if (o.id === id) {
      return o;
    }
    if (o.children) {
      const childPaths = Object.keys(o.children);
      for (let c = 0; c < childPaths.length; c++) {
        r = findEvent(o.children[childPaths[c]], id);
        if (r) return r;
      }
    }
  }
  return r;
};

const eventHasArg = (event, argName) => {
  return (
    event.args && Object.prototype.hasOwnProperty.call(event.args, argName)
  );
};

export {
  mapEvents,
  mapScenesEvents,
  mapSceneEvents,
  walkEvents,
  walkEventsDepthFirst,
  walkScenesEvents,
  walkSceneEvents,
  findSceneEvent,
  normalizedWalkSceneEvents,
  normalizedFindSceneEvent,
  patchEvents,
  prependEvent,
  appendEvent,
  regenerateEventIds,
  removeEventIds,
  filterEvents,
  findEvent,
  eventHasArg
};
