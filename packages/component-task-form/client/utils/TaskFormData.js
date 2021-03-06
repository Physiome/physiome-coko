import EventEmitter from 'event-emitter';


function _get(obj, key) {
    if(obj && obj.hasOwnProperty(key)) {
        return obj[key];
    }
    return null;
}


class TaskFormData {

    constructor(initialData = {}) {
        this._modifiedFields = {};
        this._defaultValues = {...initialData};
        this._generation = 0;
        this._submittedGeneration = 0;

        this._relationshipModifier = {};
        this._relationshipModifierClientKeyId = 1;
    }

    _hasDefaultValue(fieldID) {
        return this._defaultValues.hasOwnProperty(fieldID);
    }

    _getDefaultValue(fieldID) {
        return fieldID ? this._defaultValues[fieldID] : null;
    }

    _setDefaultValue(fieldID, value) {
        this._defaultValues[fieldID] = value;
    }


    getFieldValue(fieldID) {

        if(fieldID.indexOf('.') !== -1) {

            const path = fieldID.split('.');

            let obj =  (this._modifiedFields.hasOwnProperty(path[0]) ? this._modifiedFields[path[0]] : this._getDefaultValue(path[0]));
            if(!obj) {
                return null;
            }

            for(let i = 1; i < path.length; i++) {
                obj = _get(obj, path[i]);
                if(!obj) {
                    break;
                }
            }

            return obj;
        }

        if(this._modifiedFields.hasOwnProperty(fieldID)) {
            return this._modifiedFields[fieldID];
        }
        return this._getDefaultValue(fieldID) || undefined;
    }

    setFieldValue(fieldID, value) {

        if(fieldID.indexOf('.') !== -1) {
            throw new Error(`TaskFormData - setFieldValue doesn't support field paths (${fieldID})`);
        }

        if(this._hasDefaultValue(fieldID) && this._getDefaultValue(fieldID) === value) {
            delete this._modifiedFields[fieldID];
            this.emit(`field.${fieldID}`, this, fieldID, value);
            this.emit(`modified`);
            ++this._generation;
            return;
        }

        this._modifiedFields[fieldID] = value;
        this.emit(`field.${fieldID}`, this, fieldID, value);
        this.emit(`modified`);
        ++this._generation;
    }

    setFieldValueForComplexObject(fieldID, value) {

        if(fieldID.indexOf('.') !== -1) {
            throw new Error(`TaskFormData - setFieldValueForComplexObject doesn't support field paths (${fieldID})`);
        }

        this._modifiedFields[fieldID] = value;
        this.emit(`field.${fieldID}`, this, fieldID, value);
        this.emit(`modified`);
        ++this._generation;
    }

    resetFieldValue(fieldID) {

        if(fieldID.indexOf('.') !== -1) {
            throw new Error(`TaskFormData - resetFieldValue doesn't support field paths (${fieldID})`);
        }

        if(!this._modifiedFields.hasOwnProperty(fieldID)) {
            return;
        }

        delete this._modifiedFields[fieldID];

        this.emit(`field.${fieldID}`, this, fieldID, undefined);
        this.emit(`modified`);
        ++this._generation;
    }

    resetAllFields() {
        this._modifiedFields = {};
    }

    getModifiedData() {
        const data = {};
        let isModified = false;

        for(let k in this._modifiedFields) {
            if(this._modifiedFields.hasOwnProperty(k)) {
                data[k] = this._modifiedFields[k];
                isModified = true;
            }
        }

        return isModified ? {data, generation:this._generation} : null;
    }

    updateForSubmittedModifications({data, generation}) {

        if(generation <= this._submittedGeneration) {
            return;
        }

        const sameGeneration = (this._generation === this._submittedGeneration);
        this._submittedGeneration = generation;

        for(let k in data) {
            if(data.hasOwnProperty(k)) {
                this._setDefaultValue(k, data[k]);

                // This is not a deep compare!!
                if(!sameGeneration && this._getDefaultValue(k) === this._modifiedFields[k]) {
                    delete this._modifiedFields[k];
                }
            }
        }

        if(sameGeneration) {
            this._modifiedFields = {};
        }
    }

    overlayValues(data) {

        let didModify = false;

        for(let k in data) {
            if(data.hasOwnProperty(k)) {
                this._setDefaultValue(k, data[k]);
                delete this._modifiedFields[k];
                didModify = true;
            }
        }

        if(didModify) {
            this.emit(`modified`);
        }
    }

    getGeneration() {
        return this._generation;
    }

    supportsUpdates() {
        return true;
    }

    registerRelationshipModifier(callback) {

        const key = this._relationshipModifierClientKeyId++;
        this._relationshipModifier[key] = callback;
        return key;
    }

    unregisterRelationshipModifier(key) {

        delete this._relationshipModifier[key];
    }

    updateModifiedRelationshipsForInstance(instanceId, instanceType) {

        const formData = this;
        const p = [];

        Object.values(this._relationshipModifier).forEach(modifier => {

            const t = modifier(instanceId, instanceType, formData);
            if(t) {
                p.push(t);
            }
        });

        return p.length ? Promise.all(p) : Promise.resolve();
    }

    relationshipWasModified(relationshipFieldId) {
        this.emit(`modified`);
        ++this._generation;
    }

}

EventEmitter(TaskFormData.prototype);

export default TaskFormData;