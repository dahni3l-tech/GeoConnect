import time
import logging

logger = logging.getLogger("profiling")


class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        total_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s total=%.0fms status=%s",
            request.method,
            request.path,
            total_ms,
            response.status_code,
        )
        return response
