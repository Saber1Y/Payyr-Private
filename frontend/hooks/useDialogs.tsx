"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function useAlert() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Notice");
  const [message, setMessage] = useState("");

  const showAlert = useCallback((msg: string, alertTitle?: string) => {
    setTitle(alertTitle || "Notice");
    setMessage(msg);
    setOpen(true);
  }, []);

  const AlertDialogElement = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-black">{title}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { showAlert, AlertDialogElement };
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Confirm");
  const [message, setMessage] = useState("");
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback(
    (msg: string, confirmTitle?: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setTitle(confirmTitle || "Confirm");
        setMessage(msg);
        resolveRef.current = resolve;
        setOpen(true);
      });
    },
    [],
  );

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setOpen(false);
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setOpen(false);
  };

  const ConfirmDialogElement = (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-black">{title}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { showConfirm, ConfirmDialogElement };
}
