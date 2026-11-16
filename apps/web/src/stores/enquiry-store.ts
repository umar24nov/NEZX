import { create } from "zustand";

interface EnquiryState {
  preferredCourseSlug: string | null;
  setPreferredCourse: (slug: string) => void;
  clearPreferredCourse: () => void;
}

/**
 * Lets course cards preselect the matching option in the enquiry form before
 * scrolling to it.
 */
export const useEnquiryStore = create<EnquiryState>((set) => ({
  preferredCourseSlug: null,
  setPreferredCourse: (slug) => set({ preferredCourseSlug: slug }),
  clearPreferredCourse: () => set({ preferredCourseSlug: null }),
}));
