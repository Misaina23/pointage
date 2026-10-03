<?php

namespace App\Enums;

enum NotificationType: string
{
    case LeaveApproved = 'leave_approved';
    case LeaveRejected = 'leave_rejected';
    case PermissionApproved = 'permission_approved';
    case PermissionRejected = 'permission_rejected';
    case AbsenceRecorded = 'absence_recorded';
    case MeetingInvitation = 'meeting_invitation';
    case PlanningUpdated = 'planning_updated';
    case LateArrival = 'late_arrival';
    case AbsenceDetected = 'absence_detected';
    case NewRequest = 'new_request';
    case ApprovalRequired = 'approval_required';

    public function label(): string
    {
        return match ($this) {
            self::LeaveApproved => 'Congé approuvé',
            self::LeaveRejected => 'Congé refusé',
            self::PermissionApproved => 'Permission approuvée',
            self::PermissionRejected => 'Permission refusée',
            self::AbsenceRecorded => 'Absence enregistrée',
            self::MeetingInvitation => 'Nouvelle réunion',
            self::PlanningUpdated => 'Planning modifié',
            self::LateArrival => 'Retard',
            self::AbsenceDetected => 'Absence',
            self::NewRequest => 'Nouvelle demande',
            self::ApprovalRequired => 'Validation requise',
        };
    }
}
