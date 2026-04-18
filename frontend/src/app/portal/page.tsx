import { redirect } from "next/navigation";

export default function PortalPage() {
    // Tự động chuyển hướng vào trang Dashboard
    redirect("/portal/dashboard");
}