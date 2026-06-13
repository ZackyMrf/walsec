module walsec_registry::audit {
    use sui::event;
    use sui::tx_context::{Self, TxContext};
    use std::string::String;

    /// Event emitted when a new audit is recorded
    public struct AuditRecorded has copy, drop {
        auditor: address,
        walrus_object_id: String,
        severity: String,
        timestamp: String,
    }

    /// Entry function to record an audit
    public entry fun record_audit(
        walrus_object_id: String,
        severity: String,
        timestamp: String,
        ctx: &mut TxContext
    ) {
        event::emit(AuditRecorded {
            auditor: tx_context::sender(ctx),
            walrus_object_id,
            severity,
            timestamp,
        });
    }
}
