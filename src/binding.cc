#include <napi.h>

extern "C" {
    napi_value Init(napi_env env, napi_value exports);
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return Napi::Object(env, Init(env, exports));
}

NODE_API_MODULE(modbus, InitAll) 