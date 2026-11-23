#ifndef STREAID_H
#define STREAID_H

/*
 * Streaid core C ABI.
 *
 * Quick start:
 *   streaid_init();
 *   char *res = streaid_dispatch("{\"method\":\"chat.status\"}");
 *   ...
 *   streaid_free(res);
 *
 * All returned strings are UTF-8 JSON and must be released with streaid_free().
 * See crates/streaid-ffi/src/api.rs for the method list.
 */

#ifdef __cplusplus
extern "C" {
#endif

void streaid_init(void);

char *streaid_dispatch(const char *request);

char *streaid_poll_events(void);

char *streaid_version(void);

void streaid_free(char *ptr);

#ifdef __cplusplus
}
#endif

#endif /* STREAID_H */
