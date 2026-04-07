"""Background scheduler for daily tasks."""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.services.daily_reset import reset_daily_habits
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def daily_reset_job():
    """Daily reset job that runs at midnight."""
    logger.info("Running daily reset job...")

    async with AsyncSessionLocal() as db:
        try:
            result = await reset_daily_habits(db)
            if result["success"]:
                logger.info(f"Daily reset successful: {result}")
            else:
                logger.error(f"Daily reset failed: {result.get('error')}")
        except Exception as e:
            logger.error(f"Error in daily reset job: {e}")


def start_scheduler():
    """Start the background scheduler."""
    logger.info("Starting background scheduler...")

    # Schedule daily reset at midnight (00:00)
    scheduler.add_job(
        daily_reset_job,
        CronTrigger(hour=0, minute=0),  # Run at midnight
        id="daily_reset",
        name="Daily Habit Reset",
        replace_existing=True
    )

    # For testing: also run every hour (comment out in production)
    # scheduler.add_job(
    #     daily_reset_job,
    #     CronTrigger(minute=0),  # Run at the top of every hour
    #     id="hourly_reset_test",
    #     name="Hourly Reset Test",
    #     replace_existing=True
    # )

    scheduler.start()
    logger.info("Scheduler started successfully")


def stop_scheduler():
    """Stop the background scheduler."""
    logger.info("Stopping scheduler...")
    scheduler.shutdown()
    logger.info("Scheduler stopped")
