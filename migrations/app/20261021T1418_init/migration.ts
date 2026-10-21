#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/67b9b0c9f6a49b7c317a33926bef6ad01be668e04a47d0bd240a349e560f7132/contract';
import endContract from '../../snapshots/67b9b0c9f6a49b7c317a33926bef6ad01be668e04a47d0bd240a349e560f7132/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'AttendanceRecord',
        columns: [
          col('date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-temporal@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('markedById', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('studentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'AttendanceRecord_status_check_1d6db941',
            sql`"status" IN ('PRESENT', 'ABSENT', 'LEAVE', 'LATE')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Class',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Guardian',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isPrimary', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('studentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Notification',
        columns: [
          col('attendanceId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('body', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('guardianPhone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('providerRef', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('type', 'text', {
            notNull: true,
            default: lit('ABSENCE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Notification_status_check_45b50018',
            sql`"status" IN ('PENDING', 'SENDING', 'ACCEPTED', 'DELIVERED', 'FAILED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'NotificationAttempt',
        columns: [
          col('attemptedAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('httpStatus', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notificationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rawResponse', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('success', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Student',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('admissionNo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('classId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fullName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'TeacherClass',
        columns: [
          col('classId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['userId', 'classId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('User_role_check_19abef7c', sql`"role" IN ('ADMIN', 'TEACHER')`),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'AttendanceRecord',
        constraint: 'AttendanceRecord_studentId_date_key',
        columns: ['studentId', 'date'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Class',
        constraint: 'Class_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Notification',
        constraint: 'Notification_attendanceId_guardianPhone_type_key',
        columns: ['attendanceId', 'guardianPhone', 'type'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Student',
        constraint: 'Student_admissionNo_key',
        columns: ['admissionNo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AttendanceRecord',
        index: 'AttendanceRecord_markedById_idx_114ec907',
        columns: ['markedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AttendanceRecord',
        index: 'AttendanceRecord_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Guardian',
        index: 'Guardian_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_attendanceId_idx_b259ff3f',
        columns: ['attendanceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'NotificationAttempt',
        index: 'NotificationAttempt_notificationId_idx_adfe2654',
        columns: ['notificationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Student',
        index: 'Student_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'TeacherClass',
        index: 'TeacherClass_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'TeacherClass',
        index: 'TeacherClass_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AttendanceRecord',
        foreignKey: {
          name: 'AttendanceRecord_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AttendanceRecord',
        foreignKey: {
          name: 'AttendanceRecord_markedById_fkey',
          columns: ['markedById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Guardian',
        foreignKey: {
          name: 'Guardian_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Notification',
        foreignKey: {
          name: 'Notification_attendanceId_fkey',
          columns: ['attendanceId'],
          references: { schema: 'public', table: 'AttendanceRecord', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'NotificationAttempt',
        foreignKey: {
          name: 'NotificationAttempt_notificationId_fkey',
          columns: ['notificationId'],
          references: { schema: 'public', table: 'Notification', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Student',
        foreignKey: {
          name: 'Student_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'Class', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'TeacherClass',
        foreignKey: {
          name: 'TeacherClass_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'TeacherClass',
        foreignKey: {
          name: 'TeacherClass_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'Class', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
