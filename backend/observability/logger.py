"""Structured logging configuration."""

import logging
import sys
from typing import Any


def setup_logger(name: str = "backend", level: int = logging.INFO) -> logging.Logger:
    """Configure structured logger."""
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)

        formatter = logging.Formatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


# Global logger instance
logger = setup_logger()
