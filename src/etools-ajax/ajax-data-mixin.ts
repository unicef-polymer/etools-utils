import {Constructor} from '../types/types';

/**
 * @mixinFunction
 */
export function AjaxDataMixin<T extends Constructor<any>>(baseClass: T) {
  class AjaxDataMixinClass extends baseClass {
    _prepareMultiPartFormData(inputBody: any, prepareMultipartData: any): any {
      if (inputBody instanceof FormData) {
        return inputBody; // body is already a FromData object
      }
      let formBody = new FormData();
      const keys = Object.keys(inputBody);

      keys.forEach((key) => {
        if (prepareMultipartData) {
          formBody = this._prepareFormData(this, formBody, inputBody[key], key);
        } else {
          formBody.append(key, inputBody[key]);
        }
      });

      return formBody;
    }

    _prepareFormData(self: any, body: any, data: any, key: any): any {
      if (Array.isArray(data)) {
        if (data.length === 0) {
          // empty array
          body.append(key, []);
        } else {
          // not empty array
          data.forEach((arrData, mainIndex) => {
            const k = key + '[' + mainIndex + ']';
            if (self._isSimpleObject(arrData)) {
              // Object, not null
              Object.keys(arrData).forEach((keyArrData) => {
                body = self._prepareFormData(self, body, arrData[keyArrData], k + '[_obj][' + keyArrData + ']');
              });
            } else if (self._isFile(arrData)) {
              // File or Blobs
              body.append(k, arrData);
            } else if (Array.isArray(arrData)) {
              // Array
              body = self._prepareFormData(self, body, arrData, k);
            } else {
              // strings, null, numbers
              body.append(k, arrData);
            }
          });
        }
      } else if (self._isSimpleObject(data)) {
        // Object, not null
        Object.keys(data).forEach((keyArrData) => {
          body = self._prepareFormData(self, body, data[keyArrData], key + '[_obj][' + keyArrData + ']');
        });
      } else {
        // for Blob, File, strings, null vals
        body.append(key, data);
      }
      return body;
    }

    _isFile(data: any): boolean {
      return data instanceof File || data instanceof Blob;
    }

    _isSimpleObject(data: any): boolean {
      return data !== null && typeof data === 'object' && !Array.isArray(data) && !this._isFile(data);
    }
  }

  return AjaxDataMixinClass;
}

export default AjaxDataMixin;
