/**
 * Grading Management Page
 *
 * Teacher  : see all students in their courses, open grading panel per student
 * Admin    : see all grades across all courses, approve/release
 * Super Admin : same as admin + can override
 */
import { useState, useMemo } from "react";
import {
  Users, BookOpen, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, ChevronRight, Award, Unlock, AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
imp