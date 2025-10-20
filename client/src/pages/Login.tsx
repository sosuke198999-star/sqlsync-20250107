import { FormEvent, useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, type UserRole } from "@/lib/auth";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { user, login } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("general");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [name, password, role]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(t("login.error.requiredName"));
      return;
    }

    if (!password.trim()) {
      setError(t("login.error.requiredPassword"));
      return;
    }

    try {
      login({
        name: name.trim(),
        password: password.trim(),
        role,
      });
      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        switch (err.message) {
          case "INVALID_CREDENTIALS":
            setError(t("login.error.invalidCredentials"));
            return;
          default:
            setError(t("login.error.invalidCredentials"));
            return;
        }
      }

      setError(t("login.error.invalidCredentials"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t("login.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("login.subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role">{t("login.roleLabel")}</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder={t("login.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t("adminUsers.role.general")}</SelectItem>
                  <SelectItem value="admin">{t("adminUsers.role.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("login.usernameLabel")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("login.usernamePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("login.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive text-center">{error}</p>
            ) : null}

            <Button type="submit" className="w-full">
              {t("login.submit")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {role === "admin"
              ? t("login.footer.admin")
              : t("login.footer.general")}
          </span>
          <span>SQLSync</span>
        </CardFooter>
      </Card>
    </div>
  );
}
