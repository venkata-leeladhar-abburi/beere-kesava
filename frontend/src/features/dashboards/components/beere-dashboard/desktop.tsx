
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ArrowRight,
  Bell, Search, TrendingUp, SlidersHorizontal, Moon,
  Facebook, Instagram, Youtube, Linkedin, Menu,
  LogOut, UserRound, AlertTriangle, CheckCircle2, AlertCircle,
  Package, LayoutDashboard, Factory, IndianRupee, Users, Settings2,
  Activity, MapPin, Phone, Eye, Edit3, Layers3, ShoppingCart, Layers, X
  , Flower2 as Lotus
} from 'lucide-react';
import { Rows, Clock as PhClock } from "@phosphor-icons/react";
import { ImageWithFallback } from "../../../../shared/ui/ImageWithFallback";
import { useNavigate } from 'react-router';
import { useInView } from 'motion/react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useResponsive } from "../../../../hooks/useResponsive";
import { imgBKLogo, imgSareeFooter } from '../../../../shared/constants/weaverImages';
import { SectionNavigator, MAIN_NAV_H } from '../../../../shared/ui/SectionNavigator';
import { T, F, G, NUM, DARK_MAROON, EASE, findNavGroup, NAV_GROUPS, NAV_GROUP_FALLBACK } from './theme';
import { METRICS, WEAVERS, WEAVER_RATES, MATS, ACT } from './data.tsx';
import { FadeUp, FadeIn, AnimatedNumber, AnimatedBar, SectionHeader, Card, Label, Body, Donut, BarChart } from './ui';
// @ts-ignore
import imgHero from '../../../../assets/hero.webp';
import { TopNav } from './components/TopNav';
import { Hero } from './components/Hero';

import { MetricsBar } from './components/MetricsBar';
import { ProductionProgress, SareesProduced, FeaturedProduct, ThreeCol } from './components/ThreeCol';
import { ActivityStrip } from './components/ActivityStrip';
import { WeaverSection } from './components/WeaverSection';
import { RawMaterial } from './components/RawMaterial';
import { Footer } from './components/Footer';

export { TopNav, Hero, MetricsBar, ProductionProgress, SareesProduced, FeaturedProduct, ThreeCol, ActivityStrip, WeaverSection, RawMaterial, Footer };
