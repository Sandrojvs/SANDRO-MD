/**
 * Message Scheduling System
 * Ported from innovatorssoft/baileys — schedule messages to be sent automatically
 * at specific times or after a delay.
 *
 * Features:
 *  - schedule(jid, content, Date)       — send at an absolute time
 *  - scheduleDelay(jid, content, delayMs) — send after N milliseconds
 *  - cancel(id)                         — cancel by ID
 *  - cancelForJid(jid)                  — cancel all pending for a JID
 *  - getPending()                       — list all pending messages
 *  - get(id)                            — get a single scheduled entry
 *  - clearAll()                         — wipe the whole queue
 *  - stop()                             — stop the internal timer
 *  - start()                            — restart the timer
 */

export class MessageScheduler {
    constructor(sendMessage, options = {}) {
        this.queue = new Map();
        this.timer = null;
        this.sendMessage = sendMessage;
        this.options = {
            maxQueue:      options.maxQueue      ?? 1000,
            checkInterval: options.checkInterval ?? 1000,
            onSent:        options.onSent        ?? (() => {}),
            onFailed:      options.onFailed      ?? (() => {}),
        };
    }

    generateId() {
        return `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    schedule(jid, content, scheduledTime) {
        if (this.queue.size >= this.options.maxQueue) {
            throw new Error(`Maximum queue size (${this.options.maxQueue}) reached`);
        }
        if (scheduledTime.getTime() <= Date.now()) {
            throw new Error('Scheduled time must be in the future');
        }
        const scheduled = {
            id:            this.generateId(),
            jid,
            content,
            scheduledTime,
            createdAt:     new Date(),
            status:        'pending',
        };
        this.queue.set(scheduled.id, scheduled);
        this.ensureTimerRunning();
        return scheduled;
    }

    scheduleDelay(jid, content, delayMs) {
        return this.schedule(jid, content, new Date(Date.now() + delayMs));
    }

    cancel(id) {
        const scheduled = this.queue.get(id);
        if (scheduled && scheduled.status === 'pending') {
            scheduled.status = 'cancelled';
            this.queue.delete(id);
            return true;
        }
        return false;
    }

    cancelForJid(jid) {
        let cancelled = 0;
        for (const [id, scheduled] of this.queue) {
            if (scheduled.jid === jid && scheduled.status === 'pending') {
                scheduled.status = 'cancelled';
                this.queue.delete(id);
                cancelled++;
            }
        }
        return cancelled;
    }

    getPending() {
        return Array.from(this.queue.values()).filter(s => s.status === 'pending');
    }

    get(id) {
        return this.queue.get(id);
    }

    clearAll() {
        const count = this.queue.size;
        this.queue.clear();
        this.stopTimer();
        return count;
    }

    async processQueue() {
        const now = Date.now();
        for (const [id, scheduled] of this.queue) {
            if (scheduled.status !== 'pending') continue;
            if (scheduled.scheduledTime.getTime() > now) continue;
            try {
                const message = await this.sendMessage(scheduled.jid, scheduled.content);
                scheduled.status    = 'sent';
                scheduled.messageId = message?.key?.id ?? undefined;
                this.options.onSent(scheduled, message);
            } catch (error) {
                scheduled.status = 'failed';
                scheduled.error  = error.message;
                this.options.onFailed(scheduled, error);
            }
            this.queue.delete(id);
        }
        if (this.queue.size === 0) this.stopTimer();
    }

    ensureTimerRunning() {
        if (!this.timer) {
            this.timer = setInterval(() => this.processQueue(), this.options.checkInterval);
        }
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    stop() { this.stopTimer(); }

    start() {
        if (this.queue.size > 0) this.ensureTimerRunning();
    }
}

export const createMessageScheduler = (sendMessage, options) => {
    return new MessageScheduler(sendMessage, options);
};
