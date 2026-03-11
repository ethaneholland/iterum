import {
  ArrowSquareUpRightIcon,
  NotePencilIcon,
  EyeSlashIcon,
  MouseLeftClickIcon,
  KeyboardIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";
import iterumLogo from "../assets/iterum-logo.png";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="board-footer">

      <div className="legend-grid">

        {/* Control legend */}
        <div className="legend-item">
          <span className="legend-icon-group">
            <MouseLeftClickIcon size={18} weight="duotone" />
            <span className="legend-plus-sep">+</span>
            <MouseLeftClickIcon size={18} weight="duotone" />
            <span className="legend-plus-sep-extra"></span>
          </span>
          <span>new card</span>
        </div>

        <div className="legend-item">
          <span className="legend-icon-group">
            <span className="legend-text-btn">CTRL</span>
            <span className="legend-plus-sep">+</span>
            <MouseLeftClickIcon size={18} weight="duotone" />
          </span>
          <span>create a connection between 2 cards</span>
        </div>


      </div>

        {/* Logo */}
    <div className="footer-logo">
        <img src={iterumLogo} alt="Iterum" className="footer-logo-img" />
    </div>

    </footer>
  );
}