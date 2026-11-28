"""Cho tracing.py chạy được nhiều request cùng lúc mà không sửa file khung.

tracing.py giữ lượt đang ghi trong dict toàn cục `_case`. install() thay dict đó bằng một mapping lưu theo
contextvars: mỗi request (task asyncio, kể cả phần chạy trong asyncio.to_thread) thấy lượt của riêng nó.
Chỉ server.py gọi install(). run.py eval / simulate giữ nguyên hành vi cũ.
"""
import contextvars
from collections.abc import MutableMapping

import tracing

_EMPTY = {"id": None, "events": None, "t0": 0.0}
_var = contextvars.ContextVar("growsafe_trace")


class _ContextCase(MutableMapping):
    def _current(self):
        return _var.get(_EMPTY)

    def __getitem__(self, key):
        return self._current()[key]

    def __setitem__(self, key, value):
        _var.set({**self._current(), key: value})

    def __delitem__(self, key):
        raise TypeError("không xoá khoá của lượt trace")

    def __iter__(self):
        return iter(self._current())

    def __len__(self):
        return len(self._current())


def install():
    if not isinstance(tracing._case, _ContextCase):
        tracing._case = _ContextCase()
