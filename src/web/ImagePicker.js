/**
 * react-native-image-picker → native browser file picker.
 * Returns the same response shape: { assets: [{ uri, type, fileName, fileSize }] }
 * and the same { didCancel } flag when the user closes the picker.
 *
 * On React Native, FormData accepts { uri, type, name } objects for uploads.
 * Browsers need a real File/Blob, so we remember which File belongs to each
 * object-URL and transparently swap it in inside FormData.append. This keeps
 * the upload code in the screens byte-for-byte unchanged.
 */
const files = new Map();

if (typeof FormData !== 'undefined' && !FormData.prototype.__rnPatched) {
  const orig = FormData.prototype.append;
  FormData.prototype.append = function (name, value, filename) {
    if (value && typeof value === 'object' && !(value instanceof Blob) && typeof value.uri === 'string') {
      const f = files.get(value.uri);
      if (f) return orig.call(this, name, f, value.name || f.name);
    }
    return filename !== undefined ? orig.call(this, name, value, filename) : orig.call(this, name, value);
  };
  FormData.prototype.__rnPatched = true;
}

function pick(options, callback, capture) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options && options.mediaType === 'video' ? 'video/*' : 'image/*';
    if (capture) input.capture = 'environment';
    if (options && options.selectionLimit === 0) input.multiple = true;
    let done = false;
    const finish = (res) => {
      if (done) return;
      done = true;
      callback && callback(res);
      resolve(res);
    };
    input.onchange = () => {
      const list = Array.from(input.files || []);
      if (!list.length) return finish({ didCancel: true });
      const assets = list.map((file) => {
        const uri = URL.createObjectURL(file);
        files.set(uri, file);
        return { uri, type: file.type || 'image/jpeg', fileName: file.name, fileSize: file.size, file };
      });
      finish({ assets });
    };
    input.addEventListener('cancel', () => finish({ didCancel: true }));
    input.click();
  });
}

export const launchImageLibrary = (options, callback) => pick(options, callback, false);
export const launchCamera = (options, callback) => pick(options, callback, true);
