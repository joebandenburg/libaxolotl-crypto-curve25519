    function _allocate(bytes) {
        var address = Module._malloc(bytes.length);
        Module.HEAPU8.set(bytes, address);

        return address;
    }

    function _readBytes(address, length, array) {
        array.set(Module.HEAPU8.subarray(address, address + length));
    }

    var generatingBasePoint_ptr = Module._malloc(32);
    Module.HEAPU8[generatingBasePoint_ptr] = 9;

    return {
        generateKeyPair: function(privateKeyBuffer) {
            var privateKey = new Uint8Array(privateKeyBuffer);

            var privateKey_ptr = _allocate(privateKey);
            var publicKey_ptr = Module._malloc(32);

            Module._curve25519_donna(publicKey_ptr, privateKey_ptr, generatingBasePoint_ptr);

            var publicKey = new Uint8Array(32);
            _readBytes(publicKey_ptr, 32, publicKey);

            Module._free(publicKey_ptr);
            Module._free(privateKey_ptr);

            return {
                public: publicKey.buffer,
                private: privateKeyBuffer
            }
        },
        calculateAgreement: function(publicKey, privateKey) {
            var sharedKey_ptr = Module._malloc(32);

            var privateKey_ptr = _allocate(new Uint8Array(privateKey));
            var basePoint_ptr = _allocate(new Uint8Array(publicKey));

            Module._curve25519_donna(sharedKey_ptr, privateKey_ptr, basePoint_ptr);

            var sharedKey = new Uint8Array(32);
            _readBytes(sharedKey_ptr, 32, sharedKey);

            Module._free(sharedKey_ptr);
            Module._free(privateKey_ptr);
            Module._free(basePoint_ptr);

            return sharedKey.buffer;
        },
        sign: function(privateKey, dataToSign) {
            var signature_ptr = Module._malloc(64);
            var privateKey_ptr = _allocate(new Uint8Array(privateKey));
            var dataToSign_ptr = _allocate(new Uint8Array(dataToSign));

            Module._curve25519_sign(signature_ptr, privateKey_ptr, dataToSign_ptr, dataToSign.byteLength);

            var signature = new Uint8Array(64);
            _readBytes(signature_ptr, 64, signature);

            Module._free(signature_ptr);
            Module._free(privateKey_ptr);
            Module._free(dataToSign_ptr);

            return signature.buffer;
        },
        verifySignature: function(signerPublicKey, dataToSign, purportedSignature) {
            var publicKey_ptr = _allocate(new Uint8Array(signerPublicKey));
            var signature_ptr = _allocate(new Uint8Array(purportedSignature));
            var dataToSign_ptr = _allocate(new Uint8Array(dataToSign));

            var res = Module._curve25519_verify(signature_ptr, publicKey_ptr, dataToSign_ptr, dataToSign.byteLength);

            Module._free(publicKey_ptr);
            Module._free(signature_ptr);
            Module._free(dataToSign_ptr);

            return (res === 0);
        }
    };
}));