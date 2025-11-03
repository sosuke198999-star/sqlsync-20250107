import { FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, type UserRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, users, registerUser, updateUser } = useAuth();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("general");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("general");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => [
      { value: "general" as UserRole, label: t("adminUsers.role.general") },
      { value: "admin" as UserRole, label: t("adminUsers.role.admin") },
    ],
    [t],
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">{t("adminUsers.title")}</h1>
        <Card>
          <CardHeader>
            <CardTitle>{t("adminUsers.forbiddenTitle")}</CardTitle>
            <CardDescription>{t("adminUsers.forbiddenDescription")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const resetForm = () => {
    setName("");
    setPassword("");
    setRole("general");
    setEmail("");
    setError(null);
  };

  const resetEdit = () => {
    setEditingUserId(null);
    setEditName("");
    setEditPassword("");
    setEditRole("general");
    setEditEmail("");
    setEditError(null);
  };

  const handleStartEdit = (targetId: string) => {
    const target = users.find((item) => item.id === targetId);
    if (!target) {
      setEditError(t("adminUsers.error.notFound"));
      return;
    }
    setEditingUserId(target.id);
    setEditName(target.name);
    setEditPassword("");
    setEditRole(target.role);
    setEditEmail(target.email);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    resetEdit();
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement> | null, targetId: string) => {
    if (event) {
      event.preventDefault();
    }

    try {
      updateUser({
        id: targetId,
        name: editName,
        role: editRole,
        password: editPassword.trim() ? editPassword : undefined,
        email: editEmail,
      });

      toast({
        title: t("adminUsers.updateSuccessTitle"),
        description: t("adminUsers.updateSuccessDesc"),
      });

      resetEdit();
    } catch (err) {
      if (err instanceof Error) {
        switch (err.message) {
          case "NAME_REQUIRED":
            setEditError(t("adminUsers.error.nameRequired"));
            return;
          case "EMAIL_REQUIRED":
            setEditError(t("adminUsers.error.emailRequired"));
            return;
          case "INVALID_EMAIL":
            setEditError(t("adminUsers.error.invalidEmail"));
            return;
          case "PASSWORD_REQUIRED":
            setEditError(t("adminUsers.error.passwordRequired"));
            return;
          case "PASSWORD_TOO_SHORT":
            setEditError(t("adminUsers.error.passwordLength"));
            return;
          case "DUPLICATE_USER":
            setEditError(t("adminUsers.error.duplicate"));
            return;
          case "DUPLICATE_EMAIL":
            setEditError(t("adminUsers.error.duplicateEmail"));
            return;
          case "USER_NOT_FOUND":
            setEditError(t("adminUsers.error.notFound"));
            return;
          default:
            setEditError(t("adminUsers.error.unknown"));
            return;
        }
      }

      setEditError(t("adminUsers.error.unknown"));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      registerUser({
        name,
        password,
        role,
        email,
      });

      toast({
        title: t("adminUsers.successTitle"),
        description: t("adminUsers.successDesc"),
      });

      resetForm();
    } catch (err) {
      if (err instanceof Error) {
        switch (err.message) {
          case "NAME_REQUIRED":
            setError(t("adminUsers.error.nameRequired"));
            return;
          case "EMAIL_REQUIRED":
            setError(t("adminUsers.error.emailRequired"));
            return;
          case "INVALID_EMAIL":
            setError(t("adminUsers.error.invalidEmail"));
            return;
          case "PASSWORD_REQUIRED":
            setError(t("adminUsers.error.passwordRequired"));
            return;
          case "PASSWORD_TOO_SHORT":
            setError(t("adminUsers.error.passwordLength"));
            return;
          case "DUPLICATE_USER":
            setError(t("adminUsers.error.duplicate"));
            return;
          case "DUPLICATE_EMAIL":
            setError(t("adminUsers.error.duplicateEmail"));
            return;
          default:
            setError(t("adminUsers.error.unknown"));
            return;
        }
      }

      setError(t("adminUsers.error.unknown"));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("adminUsers.title")}</h1>
        <p className="text-muted-foreground">{t("adminUsers.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminUsers.formTitle")}</CardTitle>
          <CardDescription>{t("adminUsers.formDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">{t("adminUsers.nameLabel")}</Label>
              <Input
                id="new-user-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                placeholder={t("adminUsers.namePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-password">{t("adminUsers.passwordLabel")}</Label>
              <Input
                id="new-user-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                placeholder={t("adminUsers.passwordPlaceholder")}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-role">{t("adminUsers.roleLabel")}</Label>
              <Select
                value={role}
                onValueChange={(value: UserRole) => {
                  setRole(value);
                  setError(null);
                }}
              >
                <SelectTrigger id="new-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-email">{t("adminUsers.emailLabel")}</Label>
              <Input
                id="new-user-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                placeholder={t("adminUsers.emailPlaceholder")}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit">{t("adminUsers.submit")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminUsers.listTitle")}</CardTitle>
          <CardDescription>{t("adminUsers.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("adminUsers.listEmpty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {users.map((registeredUser) => {
                const isCurrent =
                  user.name === registeredUser.name && user.role === registeredUser.role;
                const isEditing = editingUserId === registeredUser.id;

                return (
                  <li
                    key={registeredUser.id}
                    className="rounded border p-3"
                  >
                    {isEditing ? (
                      <form
                        className="space-y-3"
                        onSubmit={(event) => handleUpdate(event, registeredUser.id)}
                      >
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor={`edit-name-${registeredUser.id}`}>
                              {t("adminUsers.nameLabel")}
                            </Label>
                            <Input
                              id={`edit-name-${registeredUser.id}`}
                              value={editName}
                              onChange={(event) => {
                                setEditName(event.target.value);
                                setEditError(null);
                              }}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`edit-role-${registeredUser.id}`}>
                              {t("adminUsers.roleLabel")}
                            </Label>
                            <Select
                              value={editRole}
                              onValueChange={(value: UserRole) => {
                                setEditRole(value);
                                setEditError(null);
                              }}
                            >
                              <SelectTrigger id={`edit-role-${registeredUser.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`edit-email-${registeredUser.id}`}>
                            {t("adminUsers.emailLabel")}
                          </Label>
                          <Input
                            id={`edit-email-${registeredUser.id}`}
                            type="email"
                            value={editEmail}
                            onChange={(event) => {
                              setEditEmail(event.target.value);
                              setEditError(null);
                            }}
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`edit-password-${registeredUser.id}`}>
                            {t("adminUsers.passwordLabel")}
                          </Label>
                          <Input
                            id={`edit-password-${registeredUser.id}`}
                            type="password"
                            value={editPassword}
                            onChange={(event) => {
                              setEditPassword(event.target.value);
                              setEditError(null);
                            }}
                            placeholder={t("adminUsers.passwordOptionalPlaceholder")}
                            minLength={editPassword ? 6 : undefined}
                          />
                          <p className="text-xs text-muted-foreground">
                            {t("adminUsers.passwordOptionalHint")}
                          </p>
                        </div>

                        {editError ? (
                          <p className="text-sm text-destructive" role="alert">
                            {editError}
                          </p>
                        ) : null}

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            {t("adminUsers.cancelEdit")}
                          </Button>
                          <Button type="submit">{t("adminUsers.saveChanges")}</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
                        <div>
                          <div className="font-medium">{registeredUser.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {registeredUser.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {registeredUser.role === "admin"
                              ? t("adminUsers.role.admin")
                              : t("adminUsers.role.general")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrent ? (
                            <Badge variant="secondary">
                              {t("adminUsers.listCurrent")}
                            </Badge>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(registeredUser.id)}
                          >
                            {t("adminUsers.edit")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
