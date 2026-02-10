import fs from 'fs/promises';
import path from 'path';
import { logError } from '@/lib/instrumentation/logger';

// File locking mechanism to prevent race conditions
const fileLocks = new Map<string, Promise<void>>();

export async function safeFileRead<T>(filePath: string): Promise<T> {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [] as unknown as T;
    }
    throw error;
  }
}

export async function safeFileWrite<T>(filePath: string, data: T): Promise<void> {
  const lockKey = filePath;
  
  // Wait for any existing operation on this file to complete
  if (fileLocks.has(lockKey)) {
    await fileLocks.get(lockKey);
  }
  
  // Create a new lock for this operation
  const lockPromise = performSafeWrite(filePath, data);
  fileLocks.set(lockKey, lockPromise);
  
  try {
    await lockPromise;
  } finally {
    fileLocks.delete(lockKey);
  }
}

async function performSafeWrite<T>(filePath: string, data: T): Promise<void> {
  const tempPath = `${filePath}.tmp`;
  const backupPath = `${filePath}.backup`;
  
  try {
    // Create backup of existing file
    try {
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      // Backup failed, but continue if original file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Write to temporary file first
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
    
    // Atomically move temp file to target location
    await fs.rename(tempPath, filePath);
    
    // Clean up backup file
    try {
      await fs.unlink(backupPath);
    } catch {
      // Ignore backup cleanup errors
    }
  } catch (error) {
    // Clean up temporary file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    
    // Try to restore from backup
    try {
      await fs.copyFile(backupPath, filePath);
      await fs.unlink(backupPath);
    } catch {
      // Ignore restore errors
    }
    
    logError(error instanceof Error ? error : new Error('File write failed'), 'safeFileWrite');
    throw error;
  }
}

// Atomic update operation
export async function atomicUpdate<T>(
  filePath: string,
  updateFn: (data: T[]) => T[]
): Promise<T[]> {
  const lockKey = filePath;
  
  // Wait for any existing operation on this file to complete
  if (fileLocks.has(lockKey)) {
    await fileLocks.get(lockKey);
  }
  
  // Create a new lock for this operation
  const lockPromise = performAtomicUpdate(filePath, updateFn);
  fileLocks.set(lockKey, lockPromise);
  
  try {
    return await lockPromise;
  } finally {
    fileLocks.delete(lockKey);
  }
}

async function performAtomicUpdate<T>(
  filePath: string,
  updateFn: (data: T[]) => T[]
): Promise<T[]> {
  // Read current data
  const currentData = await safeFileRead<T[]>(filePath);
  
  // Apply update function
  const updatedData = updateFn(currentData);
  
  // Write updated data
  await safeFileWrite(filePath, updatedData);
  
  return updatedData;
}